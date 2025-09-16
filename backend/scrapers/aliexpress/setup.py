from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="aliexpress-professional-scraper",
    version="1.0.0",
    author="Professional Scraper Team",
    description="Advanced AliExpress scraper with anti-bot bypass capabilities",
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=[
        "aiohttp>=3.9.0",
        "pymongo>=4.6.0",
        "fake-useragent>=1.4.0",
        "certifi>=2023.11.17",
        "dnspython>=2.4.0",
    ],
    entry_points={
        "console_scripts": [
            "aliexpress-scraper=aliexpress_scraper:main",
        ],
    },
)
