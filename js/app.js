// app.js - reads employee data from an XML file and renders it as a table.
(function () {
  "use strict";

  var XML_URL = "data/employees.xml";

  // Column definitions: XML tag name, header label, optional formatter / numeric flag.
  var columns = [
    { tag: "id", label: "ID", numeric: true },
    { tag: "name", label: "Name" },
    { tag: "department", label: "Department" },
    { tag: "designation", label: "Designation" },
    { tag: "email", label: "Email" },
    { tag: "phone", label: "Phone" },
    { tag: "city", label: "City" },
    { tag: "joiningDate", label: "Joining Date", format: formatDate },
    { tag: "salary", label: "Salary (INR)", numeric: true, format: formatMoney }
  ];

  // Used only when the XML file cannot be fetched (e.g. page opened via file://).
  var FALLBACK_XML =
    '<?xml version="1.0" encoding="UTF-8"?><employees>' +
    emp(101, "Anita Sharma", "Engineering", "Senior Software Engineer", "anita.sharma@example.com", "9876543210", "Bengaluru", "2019-03-15", 1450000) +
    emp(102, "Rahul Verma", "Human Resources", "HR Manager", "rahul.verma@example.com", "9123456780", "Mumbai", "2017-07-01", 1250000) +
    emp(103, "Priya Nair", "Finance", "Accountant", "priya.nair@example.com", "9988776655", "Chennai", "2020-11-23", 780000) +
    emp(104, "Karthik Reddy", "Engineering", "DevOps Engineer", "karthik.reddy@example.com", "9012345678", "Hyderabad", "2021-06-10", 1100000) +
    emp(105, "Sneha Patil", "Marketing", "Marketing Executive", "sneha.patil@example.com", "8899001122", "Pune", "2022-01-17", 620000) +
    emp(106, "Mohammed Imran", "Sales", "Sales Lead", "imran.m@example.com", "9345678901", "Delhi", "2018-09-05", 950000) +
    emp(107, "Divya Menon", "Engineering", "QA Engineer", "divya.menon@example.com", "9456123780", "Kochi", "2023-02-27", 720000) +
    emp(108, "Arjun Singh", "Finance", "Finance Manager", "arjun.singh@example.com", "9567890123", "Jaipur", "2016-04-12", 1380000) +
    "</employees>";

  function emp(id, name, dept, desig, email, phone, city, date, salary) {
    return "<employee><id>" + id + "</id><name>" + name + "</name><department>" + dept +
      "</department><designation>" + desig + "</designation><email>" + email +
      "</email><phone>" + phone + "</phone><city>" + city + "</city><joiningDate>" + date +
      "</joiningDate><salary>" + salary + "</salary></employee>";
  }

  var state = { rows: [], sortTag: "id", sortDir: 1 };

  var els = {
    thead: document.querySelector("#empTable thead"),
    tbody: document.querySelector("#empTable tbody"),
    search: document.getElementById("search"),
    dept: document.getElementById("deptFilter"),
    file: document.getElementById("fileInput"),
    status: document.getElementById("status"),
    count: document.getElementById("count")
  };

  // ---------- Formatting ----------
  function formatMoney(v) {
    var n = Number(v);
    return isNaN(n) ? v : n.toLocaleString("en-IN");
  }

  function formatDate(v) {
    var d = new Date(v);
    if (isNaN(d.getTime())) return v;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  // ---------- XML parsing ----------
  function parseXml(text) {
    var doc = new DOMParser().parseFromString(text, "application/xml");
    if (doc.getElementsByTagName("parsererror").length) {
      throw new Error("The XML is not well-formed.");
    }
    var nodes = doc.getElementsByTagName("employee");
    if (!nodes.length) throw new Error("No <employee> elements found in the XML.");

    var rows = [];
    for (var i = 0; i < nodes.length; i++) {
      var row = {};
      columns.forEach(function (c) {
        var child = nodes[i].getElementsByTagName(c.tag)[0];
        row[c.tag] = child ? child.textContent.trim() : "";
      });
      rows.push(row);
    }
    return rows;
  }

  function setStatus(message, type) {
    els.status.textContent = message || "";
    els.status.className = "status" + (type ? " " + type : "");
  }

  function load(text, note) {
    try {
      state.rows = parseXml(text);
    } catch (err) {
      state.rows = [];
      setStatus(err.message, "error");
      render();
      return;
    }
    setStatus(note || "", note ? "warn" : "");
    fillDepartments();
    render();
  }

  // ---------- Rendering ----------
  function buildHeader() {
    var tr = document.createElement("tr");
    columns.forEach(function (c) {
      var th = document.createElement("th");
      th.textContent = c.label;
      var arrow = document.createElement("span");
      arrow.className = "arrow";
      arrow.textContent = state.sortTag === c.tag ? (state.sortDir === 1 ? "▲" : "▼") : "";
      th.appendChild(arrow);
      th.addEventListener("click", function () {
        if (state.sortTag === c.tag) state.sortDir *= -1;
        else { state.sortTag = c.tag; state.sortDir = 1; }
        render();
      });
      tr.appendChild(th);
    });
    els.thead.innerHTML = "";
    els.thead.appendChild(tr);
  }

  function visibleRows() {
    var q = els.search.value.trim().toLowerCase();
    var dept = els.dept.value;
    var col = columns.filter(function (c) { return c.tag === state.sortTag; })[0];

    var rows = state.rows.filter(function (r) {
      if (dept && r.department !== dept) return false;
      if (!q) return true;
      return columns.some(function (c) { return r[c.tag].toLowerCase().indexOf(q) !== -1; });
    });

    rows.sort(function (a, b) {
      var x = a[state.sortTag], y = b[state.sortTag];
      if (col && col.numeric) return (Number(x) - Number(y)) * state.sortDir;
      return x.localeCompare(y, undefined, { sensitivity: "base" }) * state.sortDir;
    });
    return rows;
  }

  function render() {
    buildHeader();
    var rows = visibleRows();
    els.tbody.innerHTML = "";

    if (!rows.length) {
      var tr = document.createElement("tr");
      tr.className = "empty-row";
      var td = document.createElement("td");
      td.colSpan = columns.length;
      td.textContent = state.rows.length ? "No employees match your search." : "No data to display.";
      tr.appendChild(td);
      els.tbody.appendChild(tr);
    } else {
      rows.forEach(function (r) {
        var tr = document.createElement("tr");
        columns.forEach(function (c) {
          var td = document.createElement("td");
          if (c.numeric) td.className = "num";
          td.textContent = c.format ? c.format(r[c.tag]) : r[c.tag];
          tr.appendChild(td);
        });
        els.tbody.appendChild(tr);
      });
    }
    els.count.textContent = "Showing " + rows.length + " of " + state.rows.length + " employees";
  }

  function fillDepartments() {
    var seen = {};
    state.rows.forEach(function (r) { if (r.department) seen[r.department] = true; });
    var current = els.dept.value;
    els.dept.innerHTML = '<option value="">All departments</option>';
    Object.keys(seen).sort().forEach(function (d) {
      var o = document.createElement("option");
      o.value = d;
      o.textContent = d;
      els.dept.appendChild(o);
    });
    els.dept.value = seen[current] ? current : "";
  }

  // ---------- Events ----------
  els.search.addEventListener("input", render);
  els.dept.addEventListener("change", render);

  els.file.addEventListener("change", function () {
    var file = els.file.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () { load(String(reader.result), ""); };
    reader.onerror = function () { setStatus("Could not read the selected file.", "error"); };
    reader.readAsText(file);
    els.file.value = "";
  });

  // ---------- Start: fetch the XML file ----------
  setStatus("Loading employee data...");
  fetch(XML_URL)
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    })
    .then(function (text) { load(text, ""); })
    .catch(function () {
      // Browsers block fetch() on file:// pages, so use built-in sample data.
      load(
        FALLBACK_XML,
        "Could not fetch data/employees.xml (browsers block this when a page is opened by double-click). " +
        "Showing built-in sample data. Run a local server to read the real file, or use \"Load another XML\"."
      );
    });
})();
