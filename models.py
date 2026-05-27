from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base


class Section(Base):
    __tablename__ = "secciones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    prompt = Column(Text, nullable=False)
    input_type = Column(String(20), nullable=False, default="both")
    icon = Column(String(10), nullable=False, default="⚡")
    model = Column(String(50), nullable=False, default="gpt-4o")
    temperature = Column(Float, nullable=False, default=0.7)
    max_tokens = Column(Integer, nullable=False, default=2000)
    sort_order = Column(Integer, nullable=False, default=0)
    description = Column(String(500), nullable=True)
    quick_inputs = Column(Text, nullable=True)  # JSON array of preset strings
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class User(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(200), nullable=False)
    department = Column(String(100), nullable=False, default="")
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    daily_limit = Column(Integer, nullable=True)   # max queries per day, None=unlimited
    monthly_limit = Column(Integer, nullable=True)  # max queries per month
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class UserSection(Base):
    __tablename__ = "usuario_secciones"

    user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    section_id = Column(Integer, ForeignKey("secciones.id", ondelete="CASCADE"), primary_key=True)
    daily_limit = Column(Integer, nullable=True)  # per-section daily limit


class Query(Base):
    __tablename__ = "consultas"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    user_display_name = Column(String(200))
    section_id = Column(Integer, ForeignKey("secciones.id", ondelete="SET NULL"), nullable=True)
    section_name = Column(String(200))
    section_icon = Column(String(10), default="⚡")
    client_text = Column(Text)
    result = Column(Text)
    folder_path = Column(String(500))
    has_file = Column(Boolean, default=False)
    filename = Column(String(300), nullable=True)
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    status = Column(String(20))
    error_msg = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)          # JSON array of strings
    is_protected = Column(Boolean, default=False, nullable=False)
    is_favorite = Column(Boolean, default=False, nullable=False)
    is_comparison = Column(Boolean, default=False, nullable=False)
    model_b = Column(String(50), nullable=True)  # second model in comparison
    result_b = Column(Text, nullable=True)        # result from model_b
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AdminLog(Base):
    __tablename__ = "admin_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)        # e.g. "section.create"
    resource_type = Column(String(50), nullable=True)   # "section", "user", "cleanup"
    resource_id = Column(Integer, nullable=True)
    resource_name = Column(String(200), nullable=True)  # human label
    details = Column(Text, nullable=True)               # JSON extra info
    admin_ip = Column(String(60), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SectionVersion(Base):
    __tablename__ = "section_versions"

    id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("secciones.id", ondelete="CASCADE"), nullable=False)
    section_name = Column(String(200), nullable=False)
    prompt = Column(Text, nullable=False)
    model = Column(String(50), nullable=True)
    temperature = Column(Float, nullable=True)
    max_tokens = Column(Integer, nullable=True)
    changed_by_ip = Column(String(60), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    user_display_name = Column(String(200), nullable=True)
    section_id = Column(Integer, ForeignKey("secciones.id", ondelete="SET NULL"), nullable=True)
    section_name = Column(String(200))
    client_ip = Column(String(60))
    has_file = Column(Boolean, default=False)
    filename = Column(String(300), nullable=True)
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    status = Column(String(20))
    error_msg = Column(Text, nullable=True)
    duration_ms = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
