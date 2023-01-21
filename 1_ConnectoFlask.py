from flask import Flask, render_template, request, url_for, redirect, session
from sentence_transformers import util
import pandas as pd
import numpy as np
import statistics
import random
import ast

# reading in dataset with full set of words
emb_df = pd.read_pickle('words_pickle.pickle')[['words', 'Embedding']]
words = emb_df['words']

# creating a smaller set of *popular* words to be used as the prompt words
words_small = words[50:2000]

app = Flask(__name__)
app.secret_key = "flyeaglesfly"

#home page
@app.route("/", methods=["POST", "GET"])

def index():
    
    if request.method == "POST":
        name1 = request.form['name1']
        name2 = request.form['name2']
        name3 = request.form['name3']
        name4 = request.form['name4']
        input_words = [name1, name2, name3, name4]
        input_words = [word.lower() for word in input_words]
        prompt_words = session["prompts"]
        
        all_words = [prompt_words[0]] + input_words + [prompt_words[1]]
        
        # create df that will serve as main df to join emb_df with
        df = pd.DataFrame(all_words).rename(columns = {0:'word'})
        df['word2'] = df['word'].shift(-1)
        df['word3'] = df['word'].shift(-2)
        df = df.iloc[0:4]
        
        # add embbeddings for input words onto dataset via joining
        df = df.merge(emb_df, left_on = "word", right_on = "words", how = "left").rename(columns = {"Embedding":"word_embs"}).drop(columns = {'words'})
        df = df.merge(emb_df, left_on = "word2", right_on = "words", how = "left").rename(columns = {"Embedding":"word2_embs"}).drop(columns = {'words'})
        df = df.merge(emb_df, left_on = "word3", right_on = "words", how = "left").rename(columns = {"Embedding":"word3_embs"}).drop(columns = {'words'})
        
        # if there are any null values in dataset that means a word was not in the word list, so send error
        if df.isnull().values.any():
            errors_list = df[df['input_embs'].isnull()]['input']
            error = ", ".join(errors_list)
            return render_template('index.html', error=error, prompt_words=prompt_words)
        
        # otherwise we continue with calculations using cosine similarity
        else:
            perc_list = []

            for i in range(0,4):
                s1 = util.pytorch_cos_sim(df['word2_embs'][i], df['word_embs'][i])[0].numpy().max()
                s2 = util.pytorch_cos_sim(df['word2_embs'][i], df['word3_embs'][i])[0].numpy().max()
                sav = statistics.harmonic_mean([s1, s2])
                perc_list.append(sav)

            perc_ovr = str(np.mean(perc_list))
            perc_list_clean = [round(item, 2).astype('str') for item in perc_list]

            session["inputs"] = input_words
            session["input_scores"] = perc_list_clean
            session["output_ovr"] = perc_ovr

            return redirect(url_for("result"))
    
    else:
        rand_sample = random.sample(range(1, len(set(words_small))), 2)
        r1 = words_small[rand_sample[0]]
        r2 = words_small[rand_sample[1]]
        prompt_words = [r1, r2]
        session["prompts"] = prompt_words

        return render_template("index.html", prompt_words=prompt_words)
    
    
#results page    
@app.route("/result")

def result():
    
    if "output_ovr" in session:
        input_string = session["inputs"]
        input_scores = session["input_scores"]
        output_ovr_string = session["output_ovr"]
        prompt_words = session["prompts"]
        return render_template("result.html", input_string=input_string, input_scores=input_scores, output_ovr_string=output_ovr_string, prompt_words=prompt_words)
    
    else:
        return redirect(url_for("index"))
    
#refresh to main page    
@app.route("/refresh")

def refresh():
    session.pop("output_ovr", None)
    session.pop("inputs", None)
    session.pop("input_scores", None)
    rand_sample = random.sample(range(1, len(set(words_small))), 2)
    r1 = words_small[rand_sample[0]]
    r2 = words_small[rand_sample[1]]
    prompt_words = [r1, r2]
    return redirect(url_for("index"))
    
if __name__ == "__main__":
    app.run(debug=True)