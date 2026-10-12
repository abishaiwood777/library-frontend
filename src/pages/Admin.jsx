import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add Book Form state
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newTotalCopies, setNewTotalCopies] = useState("");

  // Edit Book Modal state
  const [editingBook, setEditingBook] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTotalCopies, setEditTotalCopies] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await api.get("/books");
      setBooks(res.data);
    } catch (err) {
      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : "Failed to load books."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const total = parseInt(newTotalCopies, 10);
    if (isNaN(total) || total < 0) {
      setError("Total copies must be a non-negative number.");
      return;
    }

    try {
      await api.post("/books", {
        title: newTitle,
        author: newAuthor,
        category: newCategory,
        totalCopies: total,
        availableCopies: total,
      });
      setSuccess("Book added successfully.");
      setNewTitle("");
      setNewAuthor("");
      setNewCategory("");
      setNewTotalCopies("");
      fetchBooks();
    } catch (err) {
      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : "Failed to add book."
      );
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm("Are you sure you want to delete this book?")) {
      return;
    }
    setError("");
    setSuccess("");

    try {
      await api.delete(`/books/${bookId}`);
      setSuccess("Book deleted successfully.");
      fetchBooks();
    } catch (err) {
      // Backend error clarification: "Cannot delete: this book has borrow records"
      const message =
        typeof err.response?.data === "string" && err.response.data
          ? err.response.data
          : "Cannot delete: this book has borrow records";
      setError(message);
    }
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditCategory(book.category);
    setEditTotalCopies(book.totalCopies);
  };

  const closeEditModal = () => {
    setEditingBook(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingBook) return;
    setError("");
    setSuccess("");

    const newTotal = parseInt(editTotalCopies, 10);
    if (isNaN(newTotal) || newTotal < 0) {
      setError("Total copies must be a non-negative number.");
      return;
    }

    const oldTotal = editingBook.totalCopies;
    const oldAvailable = editingBook.availableCopies;
    // When admin changes totalCopies, set availableCopies = old availableCopies + (newTotal - oldTotal), never below 0
    const calculatedAvailable = Math.max(0, oldAvailable + (newTotal - oldTotal));

    try {
      await api.put(`/books/${editingBook.id}`, {
        title: editTitle,
        author: editAuthor,
        category: editCategory,
        totalCopies: newTotal,
        availableCopies: calculatedAvailable,
      });
      setSuccess("Book updated successfully.");
      closeEditModal();
      fetchBooks();
    } catch (err) {
      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : "Failed to update book."
      );
    }
  };

  return (
    <div className="app-container">
      <Navbar user={user} />
      <div className="page-container">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="card">
          <h2 className="card-title">Add New Book</h2>
          <form onSubmit={handleAddBook} className="form-grid">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                className="form-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Author</label>
              <input
                type="text"
                className="form-input"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                className="form-input"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Total Copies</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={newTotalCopies}
                onChange={(e) => setNewTotalCopies(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Add Book
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="card-title">All Books</h2>
          {loading ? (
            <p>Loading books...</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Category</th>
                    <th>Total Copies</th>
                    <th>Available Copies</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        No books available in library.
                      </td>
                    </tr>
                  ) : (
                    books.map((book) => (
                      <tr key={book.id}>
                        <td>{book.title}</td>
                        <td>{book.author}</td>
                        <td>{book.category}</td>
                        <td>{book.totalCopies}</td>
                        <td>{book.availableCopies}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEditModal(book)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteBook(book.id)}
                            >
                              Delete
                            </button>
                          </div>
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

      {editingBook && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="card-title">Edit Book</h3>
            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Author</label>
                <input
                  type="text"
                  className="form-input"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  className="form-input"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Total Copies</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={editTotalCopies}
                  onChange={(e) => setEditTotalCopies(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
