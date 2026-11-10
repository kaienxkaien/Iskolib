    const viewContent = {
      dashboard: {
        title: "Dashboard",
        description: {
          admin: "A quick overview of the library collection.",
          student: "Your personal library overview."
        }
      },
      books: {
        title: "Book Management",
        description: "Browse the collection and manage book records."
      },
      students: {
        title: "Student Management",
        description: "View student records in the library community."
      },
      "add-book": {
        title: "Add Book",
        description: "Add a new title to the library collection."
      },
      return: {
        title: "Return Books",
        description: "Review books currently checked out."
      },
      "search-books": {
        title: "Search Books",
        description: "Explore titles available in the library collection."
      },
      "my-borrowed": {
        title: "My Borrowed Books",
        description: "View your current loans and due dates."
      }
    };

    const loginScreen = document.querySelector("#login-screen");
    const loginForm = document.querySelector("#login-form");
    const loginUsername = document.querySelector("#login-username");
    const loginPassword = document.querySelector("#login-password");
    const loginRole = document.querySelector("#login-role");
    const appContainer = document.querySelector("#app-container");
    const logoutButton = document.querySelector("#logout-button");
    const navigationButtons = [...document.querySelectorAll(".nav-link[data-navigate]")];
    const viewTitle = document.querySelector("#view-title");
    const viewDescription = document.querySelector("#view-description");
    const dashboardWelcomeName = document.querySelector("#dashboard-welcome-name");
    let activeView = "dashboard";
    let userRole = null;
    let isNavigating = false;
    let token = null;
    let currentUser = null;
    let books = [];
    let editingBook = null;
    const loginError = document.querySelector("#login-error");
    // Same origin when served by the backend (http://localhost:3000); otherwise point at it.
    const API_BASE = location.port === "3000" ? "" : "http://localhost:3000";

    async function api(path, { method = "GET", body } = {}) {
      let res;
      try {
        res = await fetch(API_BASE + path, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: body ? JSON.stringify(body) : undefined
        });
      } catch {
        throw new Error("Cannot reach the server. Is the backend running?");
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
      return data;
    }

    const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const initials = (name) => String(name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    const fmtDate = (d) => {
      if (!d) return "—";
      const dt = new Date(d);
      return isNaN(dt) ? "—" : dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    };
    const loanDate = (l) => l.borrowed_at || l.created_at || l.loan_date || l.borrowed_date;
    const empty = (msg) => `<p class="empty-state">${esc(msg)}</p>`;
    const emptyRow = (cols, msg) => `<tr><td colspan="${cols}" class="empty-state">${esc(msg)}</td></tr>`;
    const $ = (sel) => document.querySelector(sel);

    function loadView(view) {
      const jobs = {
        dashboard: loadDashboard,
        books: loadBooks,
        students: loadStudents,
        return: loadReturns,
        "search-books": loadStudentBooks,
        "my-borrowed": loadMyLoans,
        "add-book": prepareBookForm
      };
      Promise.resolve().then(() => jobs[view]?.()).catch((e) => console.error(e));
    }

    async function loadDashboard() {
      if (userRole === "admin") {
        const s = await api("/api/stats");
        $("#stat-books").textContent = s.totalBooks.toLocaleString();
        $("#stat-students").textContent = s.totalStudents.toLocaleString();
        $("#stat-borrowed").textContent = s.borrowedBooks.toLocaleString();
      } else {
        const { loans } = await api("/api/loans");
        $("#stat-my-borrowed").textContent = loans.reduce((n, l) => n + Number(l.quantity || 1), 0);
      }
    }

    // ---- Books (admin) ----
    function renderBooks() {
      const q = $("#admin-book-search").value.trim().toLowerCase();
      const list = books.filter((b) => `${b.title} ${b.author} ${b.genre}`.toLowerCase().includes(q));
      $("#book-grid").innerHTML = list.length ? list.map((b) => `
        <article class="book-card">
          <div class="book-cover"><span>${esc(b.title)}</span></div>
          <div class="book-card-content">
            <h2>${esc(b.title)}</h2>
            <p class="book-card-author">${esc(b.author)}</p>
            <span class="book-genre">${esc(b.genre)}</span>
            <p class="book-quantity">Available: <strong>${b.availableCopies}</strong> / ${b.totalCopies}</p>
            <div class="book-card-actions">
              <button class="button button-secondary" type="button" data-edit-book="${b.id}">Edit</button>
              <button class="button button-secondary button-danger" type="button" data-delete-book="${b.id}">Delete</button>
            </div>
          </div>
        </article>`).join("") : empty("No books found.");
    }

    async function loadBooks() {
      books = (await api("/api/books")).books;
      renderBooks();
    }

    $("#admin-book-search").addEventListener("input", renderBooks);

    $("#view-books").addEventListener("click", async (e) => {
      const edit = e.target.closest("[data-edit-book]");
      const del = e.target.closest("[data-delete-book]");
      if (edit) {
        editingBook = books.find((b) => b.id == edit.dataset.editBook);
        await navigateTo("add-book");
        prepareBookForm();
      }
      if (del) {
        const b = books.find((x) => x.id == del.dataset.deleteBook);
        if (!confirm(`Delete "${b.title}"?`)) return;
        try { await api(`/api/books/${b.id}`, { method: "DELETE" }); await loadBooks(); }
        catch (err) { alert(err.message); }
      }
    });

    // ---- Add / edit book ----
    function prepareBookForm() {
      const f = editingBook;
      $("#book-form-title").textContent = f ? "Edit book" : "Add a book";
      $("#book-form-submit").textContent = f ? "Save Changes" : "Add Book";
      $("#new-book-title").value = f?.title ?? "";
      $("#new-book-author").value = f?.author ?? "";
      $("#new-book-genre").value = f?.genre ?? "";
      $("#new-book-quantity").value = f?.totalCopies ?? 1;
      $("#book-form-message").hidden = true;
    }
    // leaving the form by any other route starts a fresh "add"
    document.querySelectorAll('[data-navigate="add-book"]').forEach((b) =>
      b.addEventListener("click", () => { editingBook = null; prepareBookForm(); }, true));

    $("#book-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = $("#book-form-message");
      const payload = {
        isbn: editingBook?.isbn,
        title: $("#new-book-title").value.trim(),
        author: $("#new-book-author").value.trim(),
        genre: $("#new-book-genre").value,
        quantity: Number($("#new-book-quantity").value)
      };
      try {
        if (editingBook) await api(`/api/books/${editingBook.id}`, { method: "PUT", body: payload });
        else await api("/api/books", { method: "POST", body: payload });
        msg.textContent = editingBook ? "Book updated." : "Book added.";
        msg.className = "form-message ok";
        msg.hidden = false;
        const wasEditing = !!editingBook;
        editingBook = null;
        if (!wasEditing) e.target.reset();
        await navigateTo("books");
      } catch (err) {
        msg.textContent = err.message;
        msg.className = "form-message";
        msg.hidden = false;
      }
    });

    // ---- Students (admin) ----
    async function loadStudents() {
      const { students } = await api("/api/students");
      $("#student-grid").innerHTML = students.length ? students.map((s) => `
        <article class="student-card">
          <div class="student-card-profile">
            <span class="student-avatar" aria-hidden="true">${esc(initials(s.fullName))}</span>
            <div><h2>${esc(s.fullName)}</h2><p class="student-id">${esc(s.studentId)}</p></div>
          </div>
          <p class="student-course">${esc(s.course)}</p>
          <span class="student-borrowed">${Number(s.borrowedCount)} Book${Number(s.borrowedCount) === 1 ? "" : "s"} Borrowed</span>
          <div class="student-card-actions">
            <button class="button button-secondary student-delete" type="button" data-delete-student="${s.id}" data-name="${esc(s.fullName)}">Delete</button>
          </div>
        </article>`).join("") : empty("No students registered yet.");
    }

    $("#student-grid").addEventListener("click", async (e) => {
      const del = e.target.closest("[data-delete-student]");
      if (!del || !confirm(`Remove ${del.dataset.name}?`)) return;
      try { await api(`/api/students/${del.dataset.deleteStudent}`, { method: "DELETE" }); await loadStudents(); }
      catch (err) { alert(err.message); }
    });

    const studentDialog = $("#student-dialog");
    $("#add-student-button").addEventListener("click", () => {
      $("#student-form").reset();
      $("#student-form-message").hidden = true;
      studentDialog.showModal();
    });
    $("#student-cancel").addEventListener("click", () => studentDialog.close());
    $("#student-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = $("#student-form-message");
      try {
        await api("/api/students", { method: "POST", body: {
          studentId: $("#ns-id").value.trim(),
          fullName: $("#ns-name").value.trim(),
          course: $("#ns-course").value.trim(),
          username: $("#ns-username").value.trim(),
          password: $("#ns-password").value
        }});
        studentDialog.close();
        await loadStudents();
      } catch (err) { msg.textContent = err.message; msg.hidden = false; }
    });

    // ---- Returns (admin) ----
    async function loadReturns() {
      const { loans } = await api("/api/loans");
      $("#return-table tbody").innerHTML = loans.length ? loans.map((l) => `
        <tr>
          <td>${esc(l.studentName)}</td><td>${esc(l.bookTitle)}</td>
          <td>${fmtDate(loanDate(l))}</td><td>${l.quantity}</td>
          <td>${l.status === "returned_requested"
            ? `<button class="button button-secondary" type="button" data-return="${l.id}">Return</button>`
            : `<button class="button button-secondary" type="button" disabled title="Student has not requested a return">Not requested</button>`}</td>
        </tr>`).join("") : emptyRow(5, "No books are currently checked out.");
    }
    $("#return-table").addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-return]");
      if (!btn) return;
      try { await api(`/api/loans/${btn.dataset.return}/return`, { method: "POST" }); await loadReturns(); }
      catch (err) { alert(err.message); }
    });

    // ---- Student: search + borrow ----
    const bookIcon = '<svg viewBox="0 0 48 48"><path d="M10 10c5-2 10-1 14 2v25c-4-3-9-4-14-2z"/><path d="M38 10c-5-2-10-1-14 2v25c4-3 9-4 14-2z"/><path d="M24 12v25"/></svg>';
    function renderStudentBooks() {
      const q = $("#student-book-search").value.trim().toLowerCase();
      const list = books.filter((b) => `${b.title} ${b.author} ${b.genre}`.toLowerCase().includes(q));
      $("#student-book-grid").innerHTML = list.length ? list.map((b) => `
        <article class="student-book">
          <div class="student-book-cover" aria-hidden="true">${bookIcon}</div>
          <h3>${esc(b.title)}</h3><p>${esc(b.author)} · ${esc(b.genre)}</p>
          <button class="button button-secondary" type="button" data-borrow="${b.id}" ${b.availableCopies < 1 ? "disabled" : ""}>
            ${b.availableCopies < 1 ? "Unavailable" : "Request to Borrow"}</button>
        </article>`).join("") : empty("No books match your search.");
    }
    async function loadStudentBooks() {
      books = (await api("/api/books")).books;
      renderStudentBooks();
    }
    $("#student-book-search").addEventListener("input", renderStudentBooks);
    $("#student-book-grid").addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-borrow]");
      if (!btn) return;
      try {
        await api("/api/loans", { method: "POST", body: { bookId: Number(btn.dataset.borrow), quantity: 1 } });
        alert("Book borrowed! Due in 7 days.");
        await loadStudentBooks();
      } catch (err) { alert(err.message); }
    });

    // ---- Student: my loans ----
    async function loadMyLoans() {
      const { loans } = await api("/api/loans");
      $("#borrowed-table tbody").innerHTML = loans.length ? loans.map((l) => `
        <tr>
          <td>${esc(l.bookTitle)}</td><td>${esc(l.author)}</td>
          <td>${fmtDate(loanDate(l))}</td><td>${fmtDate(l.due_date)}</td>
          <td>${l.status === "borrowed"
            ? `<button class="button button-secondary" type="button" data-request-return="${l.id}">Request Return</button>`
            : `<button class="button button-secondary" type="button" disabled>Return requested</button>`}</td>
        </tr>`).join("") : emptyRow(5, "You have no borrowed books.");
    }
    $("#borrowed-table").addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-request-return]");
      if (!btn) return;
      try { await api(`/api/loans/${btn.dataset.requestReturn}/return-request`, { method: "POST" }); await loadMyLoans(); }
      catch (err) { alert(err.message); }
    });

    function setNavigationBusy(busy) {
      navigationButtons.forEach((button) => {
        button.disabled = busy;
      });
      logoutButton.disabled = busy;
    }

    function playTransition(element, className, duration = 400) {
      return new Promise((resolve) => {
        const finish = () => {
          clearTimeout(timeoutId);
          element.removeEventListener("animationend", onAnimationEnd);
          element.classList.remove(className);
          resolve();
        };
        const onAnimationEnd = (event) => {
          if (event.target === element) finish();
        };
        const timeoutId = setTimeout(finish, duration);

        element.addEventListener("animationend", onAnimationEnd);
        element.classList.add(className);
      });
    }

    function canAccessView(viewName) {
      return userRole === "admin"
        ? ["dashboard", "books", "students", "add-book", "return"].includes(viewName)
        : ["dashboard", "search-books", "my-borrowed"].includes(viewName);
    }

    function updateRoleInterface() {
      document.querySelectorAll("[data-role]").forEach((element) => {
        element.hidden = element.dataset.role !== userRole;
      });

      navigationButtons.forEach((button) => {
        button.removeAttribute("aria-current");
        if (button.dataset.role === userRole && button.dataset.navigate === "dashboard") {
          button.setAttribute("aria-current", "page");
        }
      });

      viewTitle.textContent = "Dashboard";
      viewDescription.textContent = viewContent.dashboard.description[userRole];
      document.querySelectorAll(".view").forEach((view) => {
        view.hidden = view.id !== "view-dashboard";
      });
      activeView = "dashboard";
    }

    async function navigateTo(viewName) {
      if (!viewContent[viewName] || !canAccessView(viewName) || viewName === activeView || isNavigating) return;
      isNavigating = true;
      setNavigationBusy(true);

      const currentSection = document.querySelector(`#view-${activeView}`);
      const nextSection = document.querySelector(`#view-${viewName}`);

      await playTransition(currentSection, "is-leaving");
      currentSection.hidden = true;
      nextSection.hidden = false;
      viewTitle.textContent = viewContent[viewName].title;
      viewDescription.textContent = typeof viewContent[viewName].description === "string"
        ? viewContent[viewName].description
        : viewContent[viewName].description[userRole];

      navigationButtons.forEach((button) => {
        if (button.dataset.navigate === viewName) {
          button.setAttribute("aria-current", "page");
        } else {
          button.removeAttribute("aria-current");
        }
      });

      loadView(viewName);
      await playTransition(nextSection, "is-entering");
      activeView = viewName;
      isNavigating = false;
      setNavigationBusy(false);
    }

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isNavigating) return;

      loginError.hidden = true;
      let data;
      try {
        data = await api("/api/auth/login", {
          method: "POST",
          body: { username: loginUsername.value.trim(), password: loginPassword.value }
        });
      } catch (err) {
        loginError.textContent = err.message;
        loginError.hidden = false;
        return;
      }
      if (data.user.role !== loginRole.value) {
        loginError.textContent = `This account is not a ${loginRole.value}. Choose the correct role.`;
        loginError.hidden = false;
        return;
      }

      token = data.token;
      currentUser = data.user;
      isNavigating = true;
      setNavigationBusy(true);
      userRole = data.user.role;
      dashboardWelcomeName.textContent = data.user.name || loginUsername.value.trim();
      updateRoleInterface();
      loadView("dashboard");

      await playTransition(loginScreen, "screen-leaving", 250);
      loginScreen.hidden = true;
      appContainer.hidden = false;
      await playTransition(appContainer, "screen-entering", 300);
      isNavigating = false;
      setNavigationBusy(false);
    });

    logoutButton.addEventListener("click", async () => {
      if (isNavigating || !userRole) return;

      isNavigating = true;
      setNavigationBusy(true);
      await playTransition(appContainer, "screen-leaving", 250);
      appContainer.hidden = true;
      loginScreen.hidden = false;
      loginPassword.value = "";
      userRole = null;
      token = null;
      currentUser = null;
      await playTransition(loginScreen, "screen-entering", 300);
      loginUsername.focus();
      isNavigating = false;
      setNavigationBusy(false);
    });

    document.addEventListener("click", (event) => {
      const navigationTarget = event.target.closest("[data-navigate]");
      if (!navigationTarget || navigationTarget.matches(".brand")) return;
      event.preventDefault();
      navigateTo(navigationTarget.dataset.navigate);
    });

