# Connecto
## Installation and Usage
**Pre-requisites**: Python, Node.js installed
1. Clone the repo:
```
git clone git@github.com:tommypraeger/connecto.git && cd connecto
```

2. Set up Python dev env and start the Flask server:
```
python3 -m venv venv
source venv/bin/activate
python3 -m pip install -r requirements.txt
python3 application.py
```
This will start the API server to handle data processing on port 5000. `download_embeddings.py` is used to pre-process the embeddings used to calculate word similarity. It does not need to be re-run each time.

3. Set up React dev env and start the server:
```
npm install
npm start
```
This will start the webapp on port 3000 and open it in your browser.
