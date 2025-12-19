from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS, cross_origin
from pymongo import MongoClient
from datetime import datetime
import uuid
import os
import bcrypt
from bson import ObjectId
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ===================== APP SETUP =====================
app = Flask(__name__, static_folder='build', static_url_path='')

# Get secret key from environment variable (required for production)
app.secret_key = os.getenv('SECRET_KEY', 'smart-study-planner-secret-key-2025-dev-only')

# Get allowed origins from environment variable (comma-separated)
allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')

# Configure CORS properly for production
CORS(app, 
     resources={r"/api/*": {"origins": allowed_origins}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# ===================== JSON ENCODER =====================
class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return json.JSONEncoder.default(self, o)

app.json_encoder = JSONEncoder

# ===================== SIMPLE IN-MEMORY STORAGE =====================
# This will work even without MongoDB
users_store = {}        # email -> user data
plans_store = {}        # user_id -> list of plans
user_by_id = {}         # user_id -> user data

# ===================== MONGODB SETUP (Optional) =====================
def init_mongodb():
    """Initialize MongoDB if available, otherwise use in-memory storage"""
    try:
        # Get MongoDB URI from environment variable
        # Format for MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
        MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
        
        if not MONGO_URI or MONGO_URI == 'mongodb://localhost:27017':
            # Try local MongoDB first, then fall back to in-memory
            try:
                client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
                client.server_info()  # Test connection
            except:
                print("⚠️ Local MongoDB not available, checking for MongoDB Atlas...")
                raise Exception("No MongoDB URI configured")
        else:
            # Use MongoDB Atlas or provided URI
            client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
            client.server_info()  # Test connection
        
        print("✅ MongoDB connected successfully!")
        
        db = client["study_planner"]
        
        # Create collections
        users_col = db["users"]
        plans_col = db["plans"]
        
        # Create indexes
        users_col.create_index("email", unique=True)
        users_col.create_index("user_id", unique=True)
        plans_col.create_index("plan_id", unique=True)
        plans_col.create_index("user_id")
        
        print("✅ Database collections ready!")
        return {
            "client": client,
            "users_col": users_col,
            "plans_col": plans_col
        }
    except Exception as e:
        print(f"⚠️ MongoDB not available: {e}")
        print("✅ Using in-memory storage (no MongoDB required)")
        return None

# Initialize database
db = init_mongodb()

# Helper function to check if we can use MongoDB
def can_use_mongodb():
    return db is not None

# ===================== AUTH HELPER =====================
def get_user_from_token():
    """Get user from token (works with both MongoDB and in-memory)"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    user_id = auth_header.split(' ')[1]
    
    # Try MongoDB first
    if can_use_mongodb() and db["users_col"] is not None:
        try:
            user = db["users_col"].find_one({"user_id": user_id})
            if user:
                return user
        except:
            pass
    
    # Fallback to in-memory storage
    return user_by_id.get(user_id)

# ===================== HEALTH CHECK =====================
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "database": "mongodb" if can_use_mongodb() else "in-memory",
        "timestamp": datetime.utcnow().isoformat(),
        "users_count": len(users_store)
    })

# ===================== REGISTER USER =====================
@app.route("/api/register", methods=["POST"])
@cross_origin()
def register():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400

        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not name or not email or not password:
            return jsonify({"error": "All fields are required"}), 400

        # Check if user exists (in-memory)
        if email in users_store:
            return jsonify({"error": "User already exists"}), 409
        
        # Also check MongoDB if available
        if can_use_mongodb():
            try:
                existing = db["users_col"].find_one({"email": email})
                if existing:
                    return jsonify({"error": "User already exists"}), 409
            except:
                pass  # Continue with in-memory if MongoDB fails

        # Hash password
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        user_id = str(uuid.uuid4())
        user_data = {
            "user_id": user_id,
            "name": name,
            "email": email,
            "password": hashed_pw.decode('utf-8'),
            "created_at": datetime.utcnow(),
            "total_study_time": 0,
            "plans_count": 0,
            "completed_topics": 0,
            "last_login": datetime.utcnow()
        }

        # Store in in-memory
        users_store[email] = user_data
        user_by_id[user_id] = user_data
        
        # Also store in MongoDB if available
        if can_use_mongodb():
            try:
                db["users_col"].insert_one(user_data.copy())
            except Exception as e:
                print(f"⚠️ Could not save to MongoDB: {e}")

        return jsonify({
            "message": "Registration successful",
            "user": {
                "user_id": user_id,
                "name": name,
                "email": email
            },
            "token": user_id
        }), 201

    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({"error": "Registration failed. Please try again."}), 500

# ===================== LOGIN USER =====================
@app.route("/api/login", methods=["POST"])
@cross_origin()
def login():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        # Try in-memory storage first
        user = users_store.get(email)
        
        # If not in memory, try MongoDB
        if not user and can_use_mongodb():
            try:
                user = db["users_col"].find_one({"email": email})
            except:
                user = None
        
        if not user:
            return jsonify({"error": "Invalid email or password"}), 401

        # Check password
        if not bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):
            return jsonify({"error": "Invalid email or password"}), 401

        # Update last login
        user["last_login"] = datetime.utcnow()
        
        # Ensure user is in in-memory store
        users_store[email] = user
        user_by_id[user["user_id"]] = user

        return jsonify({
            "message": "Login successful",
            "user": {
                "user_id": user["user_id"],
                "name": user["name"],
                "email": user["email"]
            },
            "token": user["user_id"]
        }), 200

    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({"error": "Login failed. Please try again."}), 500

# ===================== GENERATE STUDY PLAN =====================
@app.route("/api/generate-plan", methods=["POST"])
@cross_origin()
def generate_plan():
    try:
        # Get user from token
        user = get_user_from_token()
        if not user:
            return jsonify({"error": "Please login first"}), 401
        
        # Get data
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        print(f"📝 Generating plan for user: {user['name']}")
        
        student_name = data.get("student_name", "").strip() or user["name"]
        exam_date = data.get("exam_date", "")
        daily_hours = data.get("daily_hours", "2")
        
        # Get topics
        topics_data = data.get("topics", [])
        if not topics_data:
            return jsonify({"error": "At least one topic is required"}), 400
        
        # Extract topics
        courses = []
        topics = []
        difficulties = []
        
        for i, topic_data in enumerate(topics_data):
            course = topic_data.get("course", "").strip() or f"Subject {i+1}"
            topic = topic_data.get("topic", "").strip()
            difficulty = topic_data.get("difficulty", "medium").lower()
            
            if not topic:
                continue
                
            courses.append(course)
            topics.append(topic)
            difficulties.append(difficulty)
        
        if not topics:
            return jsonify({"error": "Please provide valid topics"}), 400
        
        # Generate plan
        plan = generate_simple_plan(courses, topics, difficulties, daily_hours)
        if not plan:
            return jsonify({"error": "Failed to generate plan"}), 500

        # Create plan ID
        plan_id = str(uuid.uuid4())
        
        # Prepare plan document
        plan_doc = {
            "plan_id": plan_id,
            "user_id": user["user_id"],
            "student_name": student_name,
            "exam_date": exam_date,
            "daily_hours": daily_hours,
            "created_at": datetime.utcnow(),
            "plan": [
                {
                    **task,
                    "completed": False,
                    "time_spent": 0
                }
                for task in plan
            ]
        }
        
        # Store plan in in-memory
        user_id = user["user_id"]
        if user_id not in plans_store:
            plans_store[user_id] = []
        plans_store[user_id].append(plan_doc)
        
        # Update user's plan count
        user["plans_count"] = user.get("plans_count", 0) + 1
        
        # Store in MongoDB if available
        if can_use_mongodb():
            try:
                db["plans_col"].insert_one(plan_doc.copy())
                db["users_col"].update_one(
                    {"user_id": user_id},
                    {"$inc": {"plans_count": 1}}
                )
            except Exception as e:
                print(f"⚠️ Could not save to MongoDB: {e}")
        
        # Create AI meta
        ai_meta = {
            "model": "smart-study-ai",
            "summary": f"Personalized study plan for {student_name}",
            "tips": [
                "Start with easier topics to build confidence",
                "Take 5-minute breaks every 25 minutes",
                "Review previous topics regularly"
            ],
            "total_topics": len(topics),
            "total_days": len(set([item['day'] for item in plan]))
        }
        
        print(f"✅ Plan generated: {plan_id} with {len(plan)} tasks")
        
        return jsonify({
            "message": "Plan generated successfully!",
            "plan_id": plan_id,
            "student_name": student_name,
            "exam_date": exam_date,
            "daily_hours": daily_hours,
            "plan": plan,
            "ai": ai_meta
        }), 201

    except Exception as e:
        print(f"❌ Generate plan error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to generate plan. Please try again."}), 500

# ===================== GET USER DASHBOARD =====================
@app.route("/api/dashboard", methods=["GET"])
@cross_origin()
def get_dashboard():
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        
        # Get user's plans
        user_id = user["user_id"]
        user_plans = plans_store.get(user_id, [])
        
        # Also get from MongoDB if available
        if can_use_mongodb():
            try:
                mongo_plans = list(db["plans_col"].find({"user_id": user_id}).limit(10))
                if mongo_plans:
                    user_plans = mongo_plans
            except:
                pass
        
        # Calculate stats
        total_plans = len(user_plans)
        total_study_time = user.get("total_study_time", 0)
        completed_topics = user.get("completed_topics", 0)
        
        # Calculate total and completed tasks
        total_tasks = 0
        completed_tasks = 0
        for plan in user_plans:
            plan_tasks = plan.get("plan", [])
            total_tasks += len(plan_tasks)
            completed_tasks += sum(1 for task in plan_tasks if task.get("completed", False))
        
        # Get recent plans
        recent_plans = []
        for plan in user_plans[:5]:
            plan_tasks = plan.get("plan", [])
            plan_completed = sum(1 for task in plan_tasks if task.get("completed", False))
            
            recent_plans.append({
                "plan_id": plan.get("plan_id"),
                "student_name": plan.get("student_name"),
                "created_at": plan.get("created_at"),
                "progress": round((plan_completed / len(plan_tasks) * 100) if plan_tasks else 0, 1),
                "total_tasks": len(plan_tasks),
                "completed_tasks": plan_completed,
                "daily_hours": plan.get("daily_hours")
            })
        
        # Daily activity (mock data for now)
        daily_activity = [
            {"date": "2025-01-15", "day": "Mon", "study_time": 120},
            {"date": "2025-01-16", "day": "Tue", "study_time": 90},
            {"date": "2025-01-17", "day": "Wed", "study_time": 150},
            {"date": "2025-01-18", "day": "Thu", "study_time": 60},
            {"date": "2025-01-19", "day": "Fri", "study_time": 180},
            {"date": "2025-01-20", "day": "Sat", "study_time": 90},
            {"date": "2025-01-21", "day": "Sun", "study_time": 120}
        ]
        
        return jsonify({
            "user": {
                "user_id": user["user_id"],
                "name": user["name"],
                "email": user["email"],
                "created_at": user.get("created_at")
            },
            "stats": {
                "total_study_time": total_study_time,
                "completed_topics": completed_topics,
                "total_plans": total_plans,
                "active_plans": len([p for p in user_plans if not p.get("completed", False)]),
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "completion_rate": round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
            },
            "recent_plans": recent_plans,
            "daily_activity": daily_activity
        }), 200
        
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        return jsonify({"error": "Failed to load dashboard"}), 500

# ===================== UPDATE PROGRESS =====================
@app.route("/api/update-progress", methods=["POST"])
@cross_origin()
def update_progress():
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        
        data = request.get_json()
        
        plan_id = data.get("plan_id")
        task_index = data.get("task_index")
        completed = data.get("completed", False)
        time_spent = data.get("time_spent", 0)
        
        if not plan_id or task_index is None:
            return jsonify({"error": "Plan ID and task index are required"}), 400
        
        # Find plan in in-memory storage
        user_id = user["user_id"]
        user_plans = plans_store.get(user_id, [])
        
        plan = None
        plan_idx = -1
        for idx, p in enumerate(user_plans):
            if p.get("plan_id") == plan_id:
                plan = p
                plan_idx = idx
                break
        
        if not plan:
            return jsonify({"error": "Plan not found"}), 404
        
        # Update the task
        if 0 <= task_index < len(plan["plan"]):
            plan["plan"][task_index]["completed"] = completed
            plan["plan"][task_index]["time_spent"] = time_spent
            
            # Update user stats
            user["total_study_time"] = user.get("total_study_time", 0) + time_spent
            if completed:
                user["completed_topics"] = user.get("completed_topics", 0) + 1
            
            # Update in-memory storage
            plans_store[user_id][plan_idx] = plan
            
            # Also update MongoDB if available
            if can_use_mongodb():
                try:
                    # Update plan
                    db["plans_col"].update_one(
                        {"plan_id": plan_id},
                        {"$set": {
                            f"plan.{task_index}.completed": completed,
                            f"plan.{task_index}.time_spent": time_spent
                        }}
                    )
                    
                    # Update user
                    db["users_col"].update_one(
                        {"user_id": user_id},
                        {
                            "$inc": {
                                "total_study_time": time_spent,
                                "completed_topics": 1 if completed else 0
                            }
                        }
                    )
                except Exception as e:
                    print(f"⚠️ Could not update MongoDB: {e}")
            
            return jsonify({
                "message": "Progress updated successfully",
                "plan_id": plan_id,
                "task_index": task_index,
                "completed": completed,
                "time_spent": time_spent
            }), 200
        else:
            return jsonify({"error": "Invalid task index"}), 400
        
    except Exception as e:
        print(f"Update progress error: {str(e)}")
        return jsonify({"error": "Failed to update progress"}), 500

# ===================== GET PLAN =====================
@app.route("/api/plan/<plan_id>", methods=["GET"])
@cross_origin()
def get_plan(plan_id):
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        
        # Try in-memory first
        user_plans = plans_store.get(user["user_id"], [])
        for plan in user_plans:
            if plan.get("plan_id") == plan_id:
                return jsonify(plan), 200
        
        # Try MongoDB
        if can_use_mongodb():
            try:
                plan = db["plans_col"].find_one({"plan_id": plan_id, "user_id": user["user_id"]})
                if plan:
                    return jsonify(plan), 200
            except:
                pass
        
        return jsonify({"error": "Plan not found"}), 404
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


# ===================== GET USER PLANS =====================
@app.route("/api/user-plans", methods=["GET"])
@cross_origin()
def get_user_plans():
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        
        user_id = user["user_id"]
        
        # Get from in-memory storage
        user_plans = plans_store.get(user_id, [])
        
        # Also get from MongoDB if available
        if can_use_mongodb():
            try:
                mongo_plans = list(db["plans_col"].find({"user_id": user_id}).sort("created_at", -1))
                if mongo_plans:
                    user_plans = mongo_plans
            except:
                pass
        
        # Convert ObjectId to string for JSON serialization
        plans_list = []
        for plan in user_plans:
            plan_copy = plan.copy()
            if '_id' in plan_copy:
                plan_copy['_id'] = str(plan_copy['_id'])
            plans_list.append(plan_copy)
        
        return jsonify({
            "plans": plans_list,
            "count": len(plans_list)
        }), 200
        
    except Exception as e:
        print(f"Get user plans error: {str(e)}")
        return jsonify({"error": "Failed to get plans"}), 500

# ===================== PLAN GENERATION LOGIC =====================
def generate_simple_plan(courses, topics, difficulties, daily_hours):
    try:
        hours = float(daily_hours) if daily_hours else 2.0
    except:
        hours = 2.0

    daily_quota = int(hours * 60)  # Convert to minutes
    if not topics:
        return []

    base_minutes = max(20, daily_quota // len(topics))
    plan = []
    day = 1
    used_today = 0

    for i, topic in enumerate(topics):
        course = courses[i] if i < len(courses) else "General"
        level = difficulties[i] if i < len(difficulties) else "medium"

        suggested = base_minutes
        if level == "easy":
            suggested -= 5
        elif level == "hard":
            suggested += 10

        suggested = max(15, suggested)
        remaining = suggested

        while remaining > 0:
            if used_today >= daily_quota:
                day += 1
                used_today = 0

            chunk = min(remaining, daily_quota - used_today)
            remaining -= chunk
            used_today += chunk

            break_after = 10 if chunk >= 60 else 5 if chunk >= 30 else None

            plan.append({
                "day": f"Day {day}",
                "course": course,
                "topic": topic,
                "difficulty": level,
                "suggested_minutes": chunk,
                "ai_hint": pick_hint(level),
                "break_after": break_after
            })

    return plan

def pick_hint(level):
    hints = {
        "easy": "Quick win 🎯 - Build confidence with this topic",
        "medium": "Steady pace 🚀 - Focus on core concepts",
        "hard": "Deep focus 🔥 - Break into smaller parts"
    }
    return hints.get(level, "Stay focused! ⭐")

# ===================== SERVE REACT APP =====================
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Check if build folder exists
    if not app.static_folder or not os.path.exists(app.static_folder):
        return jsonify({
            "error": "Frontend not built. Please run 'npm run build' first.",
            "message": "The React app needs to be built before deployment."
        }), 503
    
    # Serve static files if they exist
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    
    # Serve index.html for all other routes (React Router)
    return send_from_directory(app.static_folder, 'index.html')

# ===================== RUN SERVER =====================
if __name__ == "__main__":
    # Get port from environment variable (Render sets PORT automatically)
    port = int(os.getenv('PORT', 5000))
    # Debug mode should be False in production
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    print("=" * 60)
    print("🚀 SMART STUDY PLANNER BACKEND")
    print("=" * 60)
    print(f"📊 Database: {'MongoDB ✅' if can_use_mongodb() else 'In-Memory ✅'}")
    print(f"🔗 API URL: http://localhost:{port}")
    print(f"🎯 Environment: {'Development' if debug_mode else 'Production'}")
    print("=" * 60)
    print("📋 Available Endpoints:")
    print("  POST /api/register        - Register new user")
    print("  POST /api/login           - Login user")
    print("  POST /api/generate-plan   - Create study plan")
    print("  GET  /api/dashboard       - User dashboard")
    print("  GET  /api/plan/<id>       - Get specific plan")
    print("  POST /api/update-progress - Update study progress")
    print("  GET  /api/health          - Health check")
    print("=" * 60)
    
    app.run(debug=debug_mode, port=port, host='0.0.0.0')