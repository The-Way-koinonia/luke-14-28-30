import sys
import os

# Add the parent directory to the system path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from scripts.generators.postgresql.cross_references_generator_psql import CrossReferencesGeneratorPSQL

def main():
    # Point to the downloaded bible_databases repo
    source_directory = os.path.expanduser('~/Downloads/bible_databases/sources')
    format_directory = os.path.join(os.path.dirname(__file__), 'output')

    if not os.path.exists(source_directory):
        print("ERROR: Please download the bible_databases repo first:")
        print("cd ~/Downloads && git clone https://github.com/scrollmapper/bible_databases.git")
        return

    # Generate Cross References SQL
    cross_references_generator = CrossReferencesGeneratorPSQL(source_directory, format_directory)
    cross_references_generator.generate()
    
    print("\n✅ Cross-reference SQL file generated!")
    print(f"📁 Location: {format_directory}/psql/extras/")

if __name__ == "__main__":
    main()
