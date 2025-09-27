import os

# Project root (folder containing manage.py)
PROJECT_ROOT = r"C:\Users\SAYLI\OneDrive\Desktop\project\srf\safe_route_project"

# Output file in the same folder
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "MergedUserCode.txt")

# File types to include
INCLUDE_EXTENSIONS = (".py", ".html", ".css", ".js")

# Folders to exclude
EXCLUDE_FOLDERS = ("venv", "_pycache_", "migrations", "node_modules", ".git")

# Files to exclude (boilerplate)
EXCLUDE_FILES = ("_init_.py", "admin.py", "apps.py", "wsgi.py", "asgi.py", "settings.py")

with open(OUTPUT_FILE, "w", encoding="utf-8") as outfile:
    for root, dirs, files in os.walk(PROJECT_ROOT):
        # Skip unwanted folders
        dirs[:] = [d for d in dirs if d not in EXCLUDE_FOLDERS]

        for file in files:
            if file.endswith(INCLUDE_EXTENSIONS) and file not in EXCLUDE_FILES:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, PROJECT_ROOT)

                # Separator for clarity
                outfile.write(f"\n\n# ===== File: {rel_path} =====\n\n")

                # Write file content
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        outfile.write(f.read())
                except Exception as e:
                    outfile.write(f"# Error reading file: {e}\n")

print(f"All user-written code has been merged into '{OUTPUT_FILE}'")