"""Copy the approved offline HTML deck into a new destination directory."""
import argparse
from pathlib import Path
import shutil


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    source = Path(__file__).resolve().parents[1] / 'assets' / 'approved-example'
    destination = args.destination.resolve()
    if destination.exists():
        parser.error('Destination already exists; choose a new directory to avoid overwriting files.')
    if destination.is_relative_to(source):
        parser.error('Destination must be outside the skill template.')
    shutil.copytree(source, destination)
    print(f'Created: {destination / "deck.html"}')
    print('Keep media/ beside deck.html. Replace example content and sources before presenting.')


if __name__ == '__main__':
    main()
