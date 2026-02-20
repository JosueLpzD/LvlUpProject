import motor.motor_asyncio
import asyncio

async def r():
    db = motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27017').lvlup
    configs = await db.commitment_configs.find().to_list(100)
    for c in configs:
        print("Wallet:", c.get("user_address"), "Habits:", c.get("selected_habit_ids"))
        if "selected_habit_ids" in c:
            for hid in c["selected_habit_ids"]:
                h = await db.habits.find_one({"_id": hid})
                if h:
                    print(" -", h.get("title"))

asyncio.run(r())
