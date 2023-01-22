from sentence_transformers import SentenceTransformer
import pandas as pd
import re


# one of the quicker pre-trained transformer models, although there are more accurate ones
sbert_model_quick = SentenceTransformer("all-MiniLM-L12-v2")
sbert_model_long = SentenceTransformer("all-mpnet-base-v2")

# read in and clean file with top 100k words
df = pd.read_csv("count_1w100k.txt", header=None)
df["words"] = df[0].str.split("\\t", expand=True)[0]

# create list of words
words = df["words"].tolist()

# clean words as prep for embeddings
words = [str(word) for word in words]
words = [word.lower() for word in words if len(word) > 2]
p = re.compile("[.!?\\-]")
words = [word for word in words if not p.match(word)]

# create embeddings
embeddings = sbert_model_quick.encode(words)
df2 = pd.DataFrame({"words": words, "Embedding": None})
df2["Embedding"] = embeddings.tolist()
df2.to_pickle("words_pickle.pickle")
