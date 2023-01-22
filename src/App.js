import "./App.css";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Container,
  CssBaseline,
  TextField,
  Typography,
} from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CloseIcon from "@mui/icons-material/Close";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useEffect, useState } from "react";

const Word = ({ children }) => {
  return (
    <Typography component="h1" variant="h4">
      {children}
    </Typography>
  );
};

const PreviousGuess = ({ guess, bottomWord }) => {
  return (
    <Typography component="h1" variant="h5" className="inline-block">
      {guess.text}
      <div className="smaller">
        (sim with {guess.aboveWord}: {guess.aboveSim}, sim with {bottomWord}: {guess.bottomSim})
      </div>
    </Typography>
  );
};

const CurrentGuess = ({
  guessText,
  setGuessText,
  guesses,
  setGuesses,
  helpText,
  setHelpText,
  setWon,
  topWord,
  bottomWord,
}) => {
  const guessNumber = guesses.length + 1;

  const handleKeyUp = (event) => {
    if (event.key === "Enter" && guessText.length > 0) {
      processGuess(
        guessText,
        setGuessText,
        guesses,
        setGuesses,
        setHelpText,
        setWon,
        topWord,
        bottomWord
      );
    }
  };

  const handleChange = (event) => {
    setGuessText(event.target.value);
    setHelpText("");
  };

  return (
    <TextField
      value={guessText}
      onKeyUp={handleKeyUp}
      onChange={handleChange}
      error={helpText.length > 0}
      helperText={helpText}
      margin="normal"
      key={`guess${guessNumber}`}
      id={`guess${guessNumber}`}
      label={`Guess ${guessNumber}`}
      name={`guess${guessNumber}`}
      autoFocus
    />
  );
};

async function getWordSimilarity(startWord, inputWord) {
  const response = await fetch(
    `http://localhost:5000/get_word_similarity?start_word=${startWord}&input_word=${inputWord}`
  );
  return await response.json();
}

async function processGuess(
  guessText,
  setGuessText,
  guesses,
  setGuesses,
  setHelpText,
  setWon,
  topWord,
  bottomWord
) {
  // for testing:
  // let aboveSim;
  // if (guessText.charCodeAt(0) % 2 === 0) {
  //   aboveSim = (Math.random() * 0.7 + 0.3).toFixed(2);
  // } else {
  //   aboveSim = (Math.random() * 0.3).toFixed(2);
  // }
  // const bottomSim = (Math.random() * 0.3 + guesses.length * 0.2).toFixed(2);

  const aboveWord = guesses.length > 0 ? guesses[guesses.length - 1].text : topWord;
  if (guessText === aboveWord) {
    setHelpText("Word must be different than the one above");
    setGuessText("");
    return;
  }
  const aboveSimResponse = await getWordSimilarity(aboveWord, guessText);
  if ("error" in aboveSimResponse) {
    setHelpText(aboveSimResponse.error);
    setGuessText("");
    return;
  }
  const aboveSim = aboveSimResponse.similarity;

  const bottomSimResponse = await getWordSimilarity(bottomWord, guessText);
  if ("error" in bottomSimResponse) {
    setHelpText(bottomSimResponse.error);
    setGuessText("");
    return;
  }
  const bottomSim = bottomSimResponse.similarity;

  if (aboveSim > 0.3) {
    setGuesses([
      ...guesses,
      {
        text: guessText,
        aboveWord: aboveWord,
        aboveSim: aboveSim,
        bottomSim: bottomSim,
      },
    ]);
    if (bottomSim > 0.3) {
      setWon(true);
    }
  } else {
    setHelpText(`${guessText}: Sim with ${aboveWord} = ${aboveSim}. Needs to be > 0.3`);
  }
  setGuessText("");
}

async function resetGame(setGuesses, setWon, setTopWord, setBottomWord) {
  fetchStartWords(setTopWord, setBottomWord);
  setGuesses([]);
  setWon(false);
}

async function fetchStartWords(setTopWord, setBottomWord) {
  const response = await fetch("http://localhost:5000/get_start_words");
  const responseJson = await response.json();
  setTopWord(responseJson.word1);
  setBottomWord(responseJson.word2);
}

function App() {
  const maxGuesses = 4;
  const [topWord, setTopWord] = useState("");
  const [bottomWord, setBottomWord] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [guessText, setGuessText] = useState("");
  const [helpText, setHelpText] = useState("");
  const [won, setWon] = useState(false);

  useEffect(() => {
    setGuesses([]);
    fetchStartWords(setTopWord, setBottomWord);
  }, []);

  const allowGuess = guesses.length < maxGuesses && !won;
  const lost = guesses.length === maxGuesses && !won;

  return (
    <div className="App">
      <ThemeProvider theme={createTheme()}>
        <Container component="main" maxWidth="xs">
          <CssBaseline />
          <Box
            sx={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography component="h1" variant="h2">
              Connecto
            </Typography>
            <Word>{topWord ? topWord : "Loading..."}</Word>
            <ArrowDownwardIcon />
            <Box>
              {guesses.map((guess, i) => (
                <div key={`guess${i + 1}`}>
                  <PreviousGuess guess={guess} bottomWord={bottomWord} />
                  {allowGuess ? <ArrowDownwardIcon /> : ""}
                </div>
              ))}
              {allowGuess ? (
                <CurrentGuess
                  guessText={guessText}
                  setGuessText={setGuessText}
                  guesses={guesses}
                  setGuesses={setGuesses}
                  helpText={helpText}
                  setHelpText={setHelpText}
                  setWon={setWon}
                  topWord={topWord}
                  bottomWord={bottomWord}
                />
              ) : (
                ""
              )}
            </Box>
            {lost ? <CloseIcon /> : <ArrowDownwardIcon />}
            <Word>{bottomWord ? bottomWord : "Loading..."}</Word>

            {allowGuess ? (
              <Button
                variant="contained"
                disabled={guessText.length < 2}
                onClick={() =>
                  processGuess(
                    guessText,
                    setGuessText,
                    guesses,
                    setGuesses,
                    setHelpText,
                    setWon,
                    topWord,
                    bottomWord
                  )
                }
              >
                Submit
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => resetGame(setGuesses, setWon, setTopWord, setBottomWord)}
              >
                Start Again
              </Button>
            )}
            {won ? (
              <Alert severity="success">
                <AlertTitle>Success</AlertTitle>
                You won!
              </Alert>
            ) : (
              ""
            )}
            {lost ? (
              <Alert severity="error">
                <AlertTitle>Failure</AlertTitle>
                You lost :(
              </Alert>
            ) : (
              ""
            )}
          </Box>
        </Container>
      </ThemeProvider>
    </div>
  );
}

export default App;
