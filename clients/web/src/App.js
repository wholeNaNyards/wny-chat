import React, { Component } from "react";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { message: "", messages: [], senderMap: {} };

    this.sendMessage = this.sendMessage.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  componentDidMount() {
    this.connection = new WebSocket(
      "wss://kessgs6puj.execute-api.us-east-1.amazonaws.com/prod/"
    );

    this.connection.onmessage = ({ data }) => {
      const { message, senderConnectionId } = JSON.parse(data);

      if (this.state.senderMap.hasOwnProperty(senderConnectionId)) {
        this.setState({
          messages: this.state.messages.concat([
            { message, senderConnectionId }
          ])
        });
      } else {
        // https://www.paulirish.com/2009/random-hex-color-code-snippets/
        const hexCode = "#" + Math.floor(Math.random() * 16777215).toString(16);

        this.setState({
          messages: this.state.messages.concat([
            { message, senderConnectionId }
          ]),
          senderMap: { ...this.state.senderMap, [senderConnectionId]: hexCode }
        });
      }
    };
  }

  componentWillUnmount() {
    this.connection.close();
  }

  sendMessage() {
    this.connection.send(
      JSON.stringify({ action: "sendmessage", data: this.state.message })
    );

    this.setState({ message: "" });
  }

  handleChange(event) {
    this.setState({ message: event.target.value });
  }

  handleKeyPress(event) {
    if (event.key === "Enter") {
      this.sendMessage();
    }
  }

  render() {
    return (
      <div className="chat-room">
        <div className="chat-list">
          {this.state.messages.map(({ message, senderConnectionId }, idx) => (
            <p key={"msg-" + idx}>
              <span
                style={{
                  color: this.state.senderMap[senderConnectionId],
                  fontWeight: 700
                }}
              >
                Anonymous
              </span>
              : {message}
            </p>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            value={this.state.message}
            onChange={this.handleChange}
            onKeyPress={this.handleKeyPress}
          />
          <button onClick={this.sendMessage}>Send</button>
        </div>
      </div>
    );
  }
}

export default App;
