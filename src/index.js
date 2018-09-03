import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

class DrawTranche extends React.Component {
  render() {
    return <div />;
  }
}

class DrawPile extends React.Component {
  render() {
    return (
      <div>
        <DrawTranche />
      </div>
    );
  }
}

class DiscardPile extends React.Component {
  render() {
    return <div />;
  }
}

class InfectionDeck extends React.Component {
  render() {
    return (
      <div>
        <DrawPile />
        <DiscardPile />
      </div>
    );
  }
}

class EpidemicTranche extends React.Component {
  render() {
    return (
      <tr>
        <td> {this.props.tranche.id + 1}</td>
        <td> {this.props.tranche.size} </td>
        <td> {this.props.tranche.hasEpidemic ? "Not Found" : "Found"}</td>
      </tr>
    );
  }
}

class PlayerDeck extends React.Component {
  epidemicProbabilityHeaders() {
    let cells = [];
    for (let i = 1; i <= this.props.playerDeck.length; ++i) {
      cells.push(<th key={i}>{i}</th>);
    }
    return (
      <tr>
        <th>Turn</th>
        {cells}
      </tr>
    );
  }

  epidemicProbabilities() {
    let playerDeck = this.props.playerDeck;
    let numEpidimics = playerDeck.length;
    let totalDeckSize = playerDeck.reduce((total, value) => {
      return total + value.size;
    }, 0);
    let numTurns = Math.ceil(totalDeckSize / 2);
    let rows = [];
    for (let i = 1; i <= numTurns; ++i) {
      let row = [<td key={0}>{i}</td>];
      for (let j = 1; j <= numEpidimics; ++j) {
        let p =
          Math.floor(
            this.calculateEpidemicProbabilities(i, j, playerDeck.slice()) * 100
          ) + "";
        row.push(
          <td key={j} className={this.epidemicClass(p)}>
            {p}
          </td>
        );
      }
      rows.push(<tr key={i}>{row}</tr>);
    }
    return rows;
  }

  epidemicClass(p) {
    if (p < 25) {
      return "low";
    }
    if (p < 75) {
      return "mid";
    }
    if (p === "100") {
      return "max";
    }
    return "high";
  }

  calculateEpidemicProbabilities(numTurns, numEpidimics, playerDeck) {
    let numCardsDrawn = numTurns * 2;
    let epidemicsHit = 0;
    // Pop off whole tranches.
    while (playerDeck.length > 0 && playerDeck[0].size <= numCardsDrawn) {
      numCardsDrawn -= playerDeck[0].size;
      if (playerDeck[0].hasEpidemic) {
        ++epidemicsHit;
      }
      playerDeck.shift();
    }
    if (epidemicsHit >= numEpidimics) {
      return 1;
    }
    if (
      epidemicsHit + 1 < numEpidimics ||
      playerDeck.length === 0 ||
      !playerDeck[0].hasEpidemic
    ) {
      return 0;
    }
    return numCardsDrawn / playerDeck[0].size;
  }

  render() {
    const epidemics = this.props.playerDeck.map(tranche => (
      <EpidemicTranche key={tranche.id} tranche={tranche} />
    ));
    return (
      <div>
        <div>Player Deck</div>
        <div>Epidemics Hit: {this.props.epidemicsHit}</div>
        <div>
          <table>
            <caption>Epidemic Probability In Next 2 Draws</caption>
            <tbody>
              {this.epidemicProbabilityHeaders()}
              {this.epidemicProbabilities()}
            </tbody>
          </table>
        </div>
        <table>
          <caption>Tranche Sizes</caption>
          <tbody>
            <tr>
              <th>Tranche</th>
              <th>Size</th>
              <th>Epidemic</th>
            </tr>
            {epidemics}
          </tbody>
        </table>
      </div>
    );
  }
}

class TurnEndButtons extends React.Component {
  render() {
    return (
      <div>
        <button onClick={this.props.noEpidemic}>No Epidemic</button>
        <button onClick={this.props.epidemic}>Epidemic</button>
      </div>
    );
  }
}

class Setup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      numCityCards: 58,
      numOtherCards: 8,
      numPlayers: 4
    };
    this.handleChange = this.handleChange.bind(this);
  }
  render() {
    return (
      <div>
        <form>
          <label>
            City Cards:{" "}
            <input
              name="numCityCards"
              value={this.state.numCityCards}
              onChange={this.handleChange}
            />
          </label>
          <label>
            Other Cards:
            <input
              name="numOtherCards"
              value={this.state.numOtherCards}
              onChange={this.handleChange}
            />
          </label>
          <label>
            Number of Players:
            <input
              name="numPlayers"
              value={this.state.numPlayers}
              onChange={this.handleChange}
            />
          </label>
          <input
            type="submit"
            value="Setup"
            onClick={event => {
              event.preventDefault();
              this.props.onSetup(this.state);
            }}
          />
        </form>
      </div>
    );
  }

  handleChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }
}

class Pandemic extends React.Component {
  constructor(props) {
    super(props);
    this.noEpidemic = this.noEpidemic.bind(this);
    this.epidemic = this.epidemic.bind(this);
    this.onSetup = this.onSetup.bind(this);
    this.state = { playerDeck: [], epidemicsHit: 0 };
  }

  // Builds a player deck from a given number of city and non-city cards.
  loadPlayerDeck(numCityCards, numOtherCards, numPlayers) {
    let playerDeck = [];
    let numTranches = getNumEpidemics(numCityCards);
    let totalCards = numCityCards + numOtherCards - numPlayers * 2;
    let minTrancheSize = Math.floor(totalCards / numTranches);
    let numLargeTranches = totalCards % numTranches;
    // Tranche 0 is the top of the deck.
    for (let i = 0; i < numTranches; ++i) {
      let trancheSize = minTrancheSize + (i < numLargeTranches ? 1 : 0);
      playerDeck.push({
        id: i,
        size: trancheSize,
        hasEpidemic: true
      });
    }
    this.setState({ playerDeck: playerDeck });
  }

  noEpidemic() {
    let playerDeck = this.state.playerDeck.slice();
    if (playerDeck.length === 0) {
      alert("Deck is empty!");
      return;
    }
    let tranche = playerDeck[0];
    --tranche.size;
    if (tranche.size === 0) {
      if (tranche.hasEpidemic) {
        alert("No epidemic found in tranche!  Game setup invalid!");
        return;
      }
      playerDeck.shift();
    }

    this.setState({ playerDeck: playerDeck });
  }

  epidemic() {
    let playerDeck = this.state.playerDeck.slice();
    if (playerDeck.length === 0) {
      alert("Deck is empty!");
      return;
    }
    let tranche = playerDeck[0];
    if (!tranche.hasEpidemic) {
      alert("Multiple epidemics found!  Game setup invalid!");
      return;
    }
    tranche.hasEpidemic = false;
    --tranche.size;
    if (tranche.size === 0) {
      playerDeck.shift();
    }

    this.setState({
      playerDeck: playerDeck,
      epidemicsHit: this.state.epidemicsHit + 1
    });
  }

  onSetup(state) {
    this.loadPlayerDeck(
      state.numCityCards,
      state.numOtherCards,
      state.numPlayers
    );
  }

  render() {
    return (
      <div>
        <TurnEndButtons noEpidemic={this.noEpidemic} epidemic={this.epidemic} />
        <InfectionDeck />
        <PlayerDeck
          playerDeck={this.state.playerDeck}
          epidemicsHit={this.state.epidemicsHit}
        />
        <Setup onSetup={this.onSetup} />
      </div>
    );
  }
}

// Returns how many epidemic cards there should be for a given number of city cards.
function getNumEpidemics(numCityCards) {
  if (numCityCards <= 37) {
    return 5;
  }
  if (numCityCards < 45) {
    return 6;
  }
  if (numCityCards < 52) {
    return 7;
  }
  if (numCityCards < 58) {
    return 8;
  }
  if (numCityCards < 63) {
    return 9;
  }
  return 10;
}

// ========================================

ReactDOM.render(<Pandemic />, document.getElementById("root"));
