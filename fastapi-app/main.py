from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

app = FastAPI(
    title="FastAPI Item Manager",
    description="A sleek, modern FastAPI application featuring CRUD operations, automatic OpenAPI documentation, and an interactive dashboard.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Models
class ItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, example="Complete FastAPI Tutorial")
    description: Optional[str] = Field(None, max_length=500, example="Build REST API with endpoints and Swagger UI")
    category: str = Field(default="General", example="Work")
    priority: str = Field(default="Medium", example="High")
    completed: bool = Field(default=False)

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = None
    priority: Optional[str] = None
    completed: Optional[bool] = None

class Item(ItemBase):
    id: int
    created_at: str

# In-memory Database initial seed
items_db: List[dict] = [
    {
        "id": 1,
        "title": "Explore Swagger Documentation",
        "description": "Visit /docs endpoint to test interactive REST API endpoints.",
        "category": "Learning",
        "priority": "High",
        "completed": True,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    },
    {
        "id": 2,
        "title": "Build Frontend Integration",
        "description": "Connect HTML/JS dashboard with backend async endpoints.",
        "category": "Development",
        "priority": "High",
        "completed": False,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    },
    {
        "id": 3,
        "title": "Add Virtual Environment Setup",
        "description": "Configure python venv and install uvicorn server.",
        "category": "DevOps",
        "priority": "Medium",
        "completed": True,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
]

id_counter = 4

# API Endpoints
@app.get("/api/items", response_model=List[Item], tags=["Items"])
def get_items(
    category: Optional[str] = Query(None, description="Filter items by category"),
    completed: Optional[bool] = Query(None, description="Filter items by completion status")
):
    """Retrieve list of items with optional category or status filters."""
    result = items_db
    if category:
        result = [item for item in result if item["category"].lower() == category.lower()]
    if completed is not None:
        result = [item for item in result if item["completed"] == completed]
    return result

@app.get("/api/items/{item_id}", response_model=Item, tags=["Items"])
def get_item(item_id: int):
    """Get detailed information of a single item by its ID."""
    for item in items_db:
        if item["id"] == item_id:
            return item
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Item with ID {item_id} not found")

@app.post("/api/items", response_model=Item, status_code=status.HTTP_201_CREATED, tags=["Items"])
def create_item(item_in: ItemCreate):
    """Create a new item in the database."""
    global id_counter
    new_item = item_in.model_dump()
    new_item["id"] = id_counter
    new_item["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    id_counter += 1
    items_db.append(new_item)
    return new_item

@app.put("/api/items/{item_id}", response_model=Item, tags=["Items"])
def update_item(item_id: int, item_in: ItemUpdate):
    """Update fields of an existing item."""
    for item in items_db:
        if item["id"] == item_id:
            update_data = item_in.model_dump(exclude_unset=True)
            item.update(update_data)
            return item
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Item with ID {item_id} not found")

@app.delete("/api/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Items"])
def delete_item(item_id: int):
    """Delete an item by its ID."""
    for idx, item in enumerate(items_db):
        if item["id"] == item_id:
            items_db.pop(idx)
            return
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Item with ID {item_id} not found")

@app.get("/api/stats", tags=["Statistics"])
def get_stats():
    """Get aggregate statistics for the dashboard."""
    total = len(items_db)
    completed = sum(1 for i in items_db if i["completed"])
    pending = total - completed
    categories = list(set(i["category"] for i in items_db))
    return {
        "total_items": total,
        "completed_items": completed,
        "pending_items": pending,
        "categories_count": len(categories)
    }

# Serve Static Dashboard Files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", include_in_schema=False)
def serve_dashboard():
    return FileResponse("static/index.html")
