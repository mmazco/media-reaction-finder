from setuptools import setup, find_packages

setup(
    name="media_reaction_finder",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        'flask',
        'flask-cors',
        'requests',
        'beautifulsoup4',
        'python-dotenv',
        'praw',
        'openai'
    ],
)
