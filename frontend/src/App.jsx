import { useState, useEffect, useRef } from "react";
import image from "./assets/Terminator.png";
import { FaUser } from "react-icons/fa6";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);  // State to toggle FAQ visibility

  const messagesEndRef = useRef(null);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // List of FAQs
  const faqs = [
    { question: "What are the admission requirements?", answer: "You need to have completed high school and meet the eligibility criteria." },
    { question: "How can I contact the college?", answer: "You can contact us at 8871729595 or 9669808182." },
    { question: "What courses are available?", answer: "We offer a variety of courses including Computer Science, Business, and more." },
    { question: "How can I apply for admission?", answer: "You can apply through our admission form or contact us for more details." },
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { sender: "user", text: input, time: getCurrentTime() },
    ];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      setTimeout(async () => {
        const response = await fetch("http://localhost:5000/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: input }),
        });

        const data = await response.json();

        setMessages([
          ...newMessages,
          { sender: "bot", text: data.reply, time: getCurrentTime() },
        ]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error connecting to the backend:", error);
      setMessages([
        ...newMessages,
        { sender: "bot", text: "Error: Unable to fetch response.", time: getCurrentTime() },
      ]);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // Toggle FAQ section visibility
  const toggleFAQ = () => {
    setShowFAQ((prev) => !prev);
  };

  // Close FAQ section
  const closeFAQ = () => {
    setShowFAQ(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 text-center text-lg font-semibold">
        Chat Application
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-center space-x-3 ${msg.sender === "user" ? "justify-end" : ""}`}
          >
            {msg.sender === "bot" && (
              <img src={image} alt="Bot Avatar" className="w-10 h-10 rounded-full" />
            )}
            <div
              className={`p-3 rounded-lg max-w-xs flex flex-col ${msg.sender === "user"
                ? "bg-gray-200 text-black"
                : "bg-blue-500 text-white"
                }`}
            >
              <span>{msg.text}</span>
              <span className={`text-xs mt-1 text-end ${msg.sender === "user" ? "text-black" : "text-white"}`}>{msg.time}</span>
            </div>
            {msg.sender === "user" && (
              <FaUser className="w-7 h-7 text-gray-600 shadow-lg rounded-full" />
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-3">
            <img src={image} alt="Bot Avatar" className="w-10 h-10 rounded-full" />
            <div className="p-3 rounded-lg max-w-xs hidden bg-blue-500 text-white"></div>
            <span>Loading...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white p-4 border-t flex items-center space-x-2">
        <input
          type="text"
          placeholder="Ask Terminator..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Send
        </button>
      </div>

      {/* FAQ Section Toggle Button */}
      <button
        onClick={toggleFAQ}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg fixed bottom-16 right-4 hover:bg-blue-600"
      >
        {showFAQ ? "Hide FAQ" : "Show FAQ"}
      </button>

      {/* FAQ Section */}
      {showFAQ && (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 max-h-60 overflow-y-auto border-t">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg mb-4">Frequently Asked Questions</h3>
            <button
              onClick={closeFAQ}
              className="bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600"
            >
              Close
            </button>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div key={index} className="cursor-pointer">
                <strong>{faq.question}</strong>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
