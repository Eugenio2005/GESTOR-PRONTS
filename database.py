import sqlite3
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./gestor_prompts.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 15},
)

@event.listens_for(engine, "connect")
def _set_sqlite_pragmas(dbapi_conn, _):
    cur = dbapi_conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL")
    cur.execute("PRAGMA synchronous=NORMAL")
    cur.execute("PRAGMA busy_timeout=10000")
    cur.execute("PRAGMA cache_size=-16000")
    cur.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations():
    conn = sqlite3.connect("gestor_prompts.db", timeout=15)
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL")

    cur.execute("PRAGMA table_info(secciones)")
    cols = {r[1] for r in cur.fetchall()}
    for col, defn in [
        ("icon",        "VARCHAR(10)  NOT NULL DEFAULT '⚡'"),
        ("model",       "VARCHAR(50)  NOT NULL DEFAULT 'gpt-4o'"),
        ("temperature", "FLOAT        NOT NULL DEFAULT 0.7"),
        ("max_tokens",  "INTEGER      NOT NULL DEFAULT 2000"),
        ("sort_order",  "INTEGER      NOT NULL DEFAULT 0"),
        ("description",  "VARCHAR(500)"),
        ("quick_inputs", "TEXT"),
    ]:
        if col not in cols:
            cur.execute(f"ALTER TABLE secciones ADD COLUMN {col} {defn}")

    cur.execute("PRAGMA table_info(consultas)")
    cols = {r[1] for r in cur.fetchall()}
    for col, defn in [
        ("tags", "TEXT"),
    ]:
        if col not in cols:
            cur.execute(f"ALTER TABLE consultas ADD COLUMN {col} {defn}")

    cur.execute("PRAGMA table_info(usuarios)")
    cols = {r[1] for r in cur.fetchall()}
    for col, defn in [
        ("daily_limit",   "INTEGER"),
        ("monthly_limit", "INTEGER"),
    ]:
        if col not in cols:
            cur.execute(f"ALTER TABLE usuarios ADD COLUMN {col} {defn}")

    cur.execute("PRAGMA table_info(usuario_secciones)")
    cols = {r[1] for r in cur.fetchall()}
    for col, defn in [
        ("daily_limit", "INTEGER"),
    ]:
        if col not in cols:
            cur.execute(f"ALTER TABLE usuario_secciones ADD COLUMN {col} {defn}")

    cur.execute("PRAGMA table_info(logs)")
    cols = {r[1] for r in cur.fetchall()}
    for col, defn in [
        ("duration_ms",        "INTEGER NOT NULL DEFAULT 0"),
        ("user_display_name",  "VARCHAR(200)"),
    ]:
        if col not in cols:
            cur.execute(f"ALTER TABLE logs ADD COLUMN {col} {defn}")

    cur.execute("PRAGMA table_info(consultas)")
    cols = {r[1] for r in cur.fetchall()}
    for col, defn in [
        ("is_protected",  "BOOLEAN NOT NULL DEFAULT 0"),
        ("is_comparison", "BOOLEAN NOT NULL DEFAULT 0"),
        ("model_b",       "VARCHAR(50)"),
        ("result_b",      "TEXT"),
    ]:
        if col not in cols:
            cur.execute(f"ALTER TABLE consultas ADD COLUMN {col} {defn}")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS admin_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action VARCHAR(100) NOT NULL,
            resource_type VARCHAR(50),
            resource_id INTEGER,
            resource_name VARCHAR(200),
            details TEXT,
            admin_ip VARCHAR(60),
            created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS section_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            section_id INTEGER NOT NULL REFERENCES secciones(id) ON DELETE CASCADE,
            section_name VARCHAR(200) NOT NULL,
            prompt TEXT NOT NULL,
            model VARCHAR(50),
            temperature FLOAT,
            max_tokens INTEGER,
            changed_by_ip VARCHAR(60),
            created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token VARCHAR(64) UNIQUE NOT NULL,
            user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
            expires_at DATETIME NOT NULL,
            used BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
        )
    """)

    conn.commit()
    conn.close()
