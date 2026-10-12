import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api";

export default function Member() {
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      fetchBooks("");
      fetchHistory(parsed.id);
    }
  }, []);

  const fetchBooks = async (query = "") => {
    setLoadingBooks(true);
    try {
      const trimmed = query.trim();
      const endpoint = trimmed
        ? `/books/search?q=${encodeURIComponent(trimmed)}`
        : "/books";
      const res = await api.get(endpoint);
      setBooks(res.data);
    } catch (err) {
      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : "Failed to fetch books."
      );
    } finally {
      setLoadingBooks(false);
    }
  };

  const fetchHistory = async (userId) => {
    if (!userId) return;
    setLoadingHistory(true);
    try {
      const res = await api.get(`/borrow/user/${userId}`);
      setHistory(res.data);
    } catch (err) {
      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : "Failed to fetch borrowed books."
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBooks(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    fetchBooks("");
  };

  const handleBorrow = async (bookId) => {
    if (!user) return;
    setError("");
    setSuccess("");

    try {
      await api.post(`/borrow?userId=${user.id}&bookId=${bookId}`);
      setSuccess("Book borrowed successfully!");
      fetchBooks(searchQuery);
      fetchHistory(user.id);
    } catch (err) {
      const msg =
        typeof err.response?.data === "string" && err.response.data
          ? err.response.data
          : err.response?.data?.message || "No copies available";
      setError(msg);
    }
  };

  const handleReturn = async (recordId) => {
    if (!user) return;
    setError("");
    setSuccess("");

    try {
      await api.put(`/borrow/${recordId}/return`);
      setSuccess("Book returned successfully!");
      fetchBooks(searchQuery);
      fetchHistory(user.id);
    } catch (err) {
      const msg =
        typeof err.response?.data === "string" && err.response.data
          ? err.response.data
          : err.response?.data?.message || "Book already returned";
      setError(msg);
    }
  };

  return (
    <div className="app-container">
      <Navbar user={user} />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Available Books Section */}
        <div className="card">
          <h2 className="card-title">Available Books</h2>
          <form onSubmit={handleSearchSubmit} className="search-container">
            <input
              type="text"
              placeholder="Search books by title, author, or category..."
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClearSearch}
              >
                Clear
              </button>
            )}
          </form>

          {loadingBooks ? (
            <p>Loading books...</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Category</th>
                    <th>Available Copies</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {books.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        No books found.
                      </td>
                    </tr>
                  ) : (
                    books.map((book) => (
                      <tr key={book.id}>
                        <td>{book.title}</td>
                        <td>{book.author}</td>
                        <td>{book.category}</td>
                        <td>
                          {book.availableCopies > 0 ? (
                            <span className="badge badge-success">
                              {book.availableCopies} available
                            </span>
                          ) : (
                            <span className="badge badge-warning">
                              Out of stock
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={book.availableCopies === 0}
                            onClick={() => handleBorrow(book.id)}
                          >
                            Borrow
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* My Borrowed Books Section */}
        <div className="card">
          <h2 className="card-title">My Borrowed Books</h2>
          {loadingHistory ? (
            <p>Loading history...</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Book Title</th>
                    <th>Borrow Date</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        You have not borrowed any books.
                      </td>
                    </tr>
                  ) : (
                    history.map((record) => (
                      <tr key={record.id}>
                        <td>{record.book?.title || "Unknown Book"}</td>
                        <td>{record.borrowDate ? new Date(record.borrowDate).toLocaleDateString() : "-"}</td>
                        <td>{record.dueDate ? new Date(record.dueDate).toLocaleDateString() : "-"}</td>
                        <td>
                          {record.returnDate
                            ? new Date(record.returnDate).toLocaleDateString()
                            : "Not returned"}
                        </td>
                        <td>
                          {record.returnDate === null && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleReturn(record.id)}
                            >
                              Return
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
