# conftest.py for shared/ tests
# Ensures project root is on sys.path for all tests, regardless of invocation directory
import sys
import os

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)
