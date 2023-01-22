from flask import Flask, request
from flask_cors import CORS
from sentence_transformers import util
import pandas as pd
import numpy as np
import random


# reading in dataset with full set of words
emb_df = pd.read_pickle("words_pickle.pickle")[["words", "Embedding"]]
words = emb_df["words"]

# creating a smaller set of *popular* words to be used as the prompt words
words_small = words[50:2000]

app = Flask(__name__)
CORS(app, support_credentials=True)
# app.secret_key = "flyeaglesfly"


@app.route("/get_start_words")
def get_start_words():
    rand_sample = random.sample(range(1, len(set(words_small))), 2)
    word1 = words_small[rand_sample[0]]
    word2 = words_small[rand_sample[1]]
    return {"word1": word1, "word2": word2}


@app.route("/get_word_similarity")
def get_word_similarity():
    start_word = request.args["start_word"]
    input_word = request.args["input_word"]

    try:
        input_word_embs = emb_df.query("words == @input_word").iloc[0]["Embedding"]
    except IndexError:
        # start word should always be found...
        return {"error": f'"{input_word}" was not recognized. Try again.'}
    try:
        start_word_embs = emb_df.query("words == @start_word").iloc[0]["Embedding"]
    except IndexError:
        # start word should always be found...
        return {"error": f'"{start_word}" was not recognized. Try again.'}

    cos_sim = util.pytorch_cos_sim(start_word_embs, input_word_embs)[0].numpy()[0]

    return {"similarity": str(round(cos_sim, 2))}


if __name__ == "__main__":
    app.run(debug=True)
