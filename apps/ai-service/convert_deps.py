#!/usr/bin/env python3
import toml
import sys

def convert_poetry_deps_to_requirements():
    try:
        # Load the pyproject.toml file
        pyproject = toml.load('pyproject.toml')
        
        # Extract dependencies from the poetry section
        dependencies = pyproject.get('tool', {}).get('poetry', {}).get('dependencies', {})
        
        # Convert dependencies to requirements.txt format
        requirements = []
        
        for package, constraint in dependencies.items():
            # Skip python dependency as it's not needed in requirements.txt
            if package == 'python':
                continue
                
            # Handle different constraint formats
            if isinstance(constraint, str):
                # Simple version constraint (e.g., "^1.2.3")
                # Convert ^ to >= for pip compatibility
                if constraint.startswith('^'):
                    version = constraint[1:]
                    req = f"{package}>={version}"
                elif constraint.startswith('~'):
                    version = constraint[1:]
                    req = f"{package}>={version}"
                else:
                    req = f"{package}{constraint}"
                requirements.append(req)
            elif isinstance(constraint, dict):
                # Complex constraint with extras or other options
                version = constraint.get('version', '')
                extras = constraint.get('extras', [])
                
                if extras:
                    extras_str = f"[{','.join(extras)}]"
                    if version.startswith('^'):
                        version = version[1:]
                        req = f"{package}{extras_str}>={version}"
                    elif version.startswith('~'):
                        version = version[1:]
                        req = f"{package}{extras_str}>={version}"
                    else:
                        req = f"{package}{extras_str}{version}"
                else:
                    if version.startswith('^'):
                        version = version[1:]
                        req = f"{package}>={version}"
                    elif version.startswith('~'):
                        version = version[1:]
                        req = f"{package}>={version}"
                    else:
                        req = f"{package}{version}"
                requirements.append(req)
        
        # Print requirements to stdout
        for req in requirements:
            print(req)
            
    except Exception as e:
        print(f"Error converting dependencies: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    convert_poetry_deps_to_requirements()
