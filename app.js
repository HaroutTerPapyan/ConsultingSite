(function () {
  "use strict";

  var CONTACT_EMAIL = "haroutter@gmail.com";

  // Replace with your real Formspree endpoint (formspree.io/f/xxxxxxxx) once
  // you've created a form there. Until this still contains "YOUR_FORM_ID",
  // submissions skip the network attempt and go straight to the mailto
  // fallback below.
  var FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";

  var VALID_PAGES = [
    "home", "flagship", "it-ops", "interfaces", "hrtech", "learning", "disability",
    "compliance", "digital", "vendor", "analytics", "tools"
  ];

  function showPage(id, opts) {
    opts = opts || {};
    if (VALID_PAGES.indexOf(id) === -1) id = "home";
    var pages = document.querySelectorAll(".page");
    for (var i = 0; i < pages.length; i++) {
      pages[i].classList.toggle("active", pages[i].id === "page-" + id);
    }
    document.body.setAttribute("data-current-page", id);
    if (!opts.keepScroll) window.scrollTo(0, 0);
    var titleEl = document.querySelector("#page-" + id + " [data-page-title]");
    document.title = titleEl ? titleEl.textContent.trim() + " — Ter-Papyan Health IT Advisors" : "Ter-Papyan Health IT Advisors";
  }

  function currentHash() {
    var h = (window.location.hash || "").replace("#", "").trim();
    return h || "home";
  }

  function route(opts) {
    showPage(currentHash(), opts);
  }

  window.addEventListener("hashchange", function () { route(); });

  function openMenu() {
    var panel = document.getElementById("nav-panel");
    if (panel) panel.hidden = false;
  }
  function closeMenu() {
    var panel = document.getElementById("nav-panel");
    if (panel) panel.hidden = true;
  }

  function initNav() {
    var openBtn = document.getElementById("menu-open");
    var closeBtn = document.getElementById("menu-close");
    var panel = document.getElementById("nav-panel");
    if (openBtn) openBtn.addEventListener("click", openMenu);
    if (closeBtn) closeBtn.addEventListener("click", closeMenu);
    if (panel) {
      panel.addEventListener("click", function (e) {
        if (e.target === panel) closeMenu();
      });
    }
    var navLinks = document.querySelectorAll("#nav-panel a[href^='#']");
    for (var i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener("click", function () { closeMenu(); });
    }
  }

  function initContactShortcuts() {
    var btns = document.querySelectorAll("[data-goto-contact]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function (e) {
        e.preventDefault();
        window.location.hash = "home";
        route();
        setTimeout(function () {
          var form = document.getElementById("home-contact-form");
          if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 30);
      });
    }
  }

  function initLocalScroll() {
    var btns = document.querySelectorAll("[data-scroll-local]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function (e) {
        e.preventDefault();
        var page = this.closest(".page");
        var form = page ? page.querySelector("form[data-lead-form]") : null;
        if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function initCopyButtons() {
    var btns = document.querySelectorAll(".copy-btn");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function () {
        var text = this.getAttribute("data-copy");
        var label = this;
        var original = label.textContent;
        function done(ok) {
          label.textContent = ok ? "Copied" : "Select to copy";
          setTimeout(function () { label.textContent = original; }, 1600);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { done(true); }).catch(function () { done(false); });
        } else {
          done(false);
        }
      });
    }
  }

  function fieldValue(form, name) {
    var el = form.querySelector("[name='" + name + "']");
    return el ? el.value.trim() : "";
  }

  function buildMailto(serviceName, data) {
    var subject = "Inquiry: " + (serviceName || "General");
    var bodyLines = [
      "Name: " + data.name,
      "Organization: " + data.org,
      "Email: " + data.email,
      "",
      data.message
    ];
    var body = bodyLines.join("\n");
    return "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  }

  function showConfirm(form, html) {
    var confirm = form.parentElement.querySelector(".confirm");
    if (confirm) {
      confirm.innerHTML = html;
      confirm.classList.add("show");
    }
  }

  function fallbackToMailto(form, serviceName, data) {
    var mailtoLink = buildMailto(serviceName, data);
    showConfirm(form, "Thanks, " + (data.name.split(" ")[0] || "there") +
      " — your email app should be opening with this pre-filled. If nothing happens, " +
      "email <strong>" + CONTACT_EMAIL + "</strong> directly, or use the copy button below.");
    var opener = document.createElement("a");
    opener.href = mailtoLink;
    opener.style.display = "none";
    document.body.appendChild(opener);
    opener.click();
    setTimeout(function () { document.body.removeChild(opener); }, 500);
  }

  function initForms() {
    var forms = document.querySelectorAll("form[data-lead-form]");
    for (var i = 0; i < forms.length; i++) {
      (function (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          if (form.reportValidity && !form.reportValidity()) return;

          var data = {
            name: fieldValue(form, "name"),
            org: fieldValue(form, "org"),
            email: fieldValue(form, "email"),
            message: fieldValue(form, "message")
          };
          var serviceName = form.getAttribute("data-service-name") || "General inquiry";
          var submitBtn = form.querySelector("button[type='submit']");
          if (submitBtn) submitBtn.disabled = true;

          function done() {
            if (submitBtn) submitBtn.disabled = false;
            form.reset();
          }

          var configured = FORMSPREE_ENDPOINT.indexOf("YOUR_FORM_ID") === -1;
          if (!configured) {
            fallbackToMailto(form, serviceName, data);
            done();
            return;
          }

          var body = new FormData();
          body.append("name", data.name);
          body.append("organization", data.org);
          body.append("email", data.email);
          body.append("message", data.message);
          body.append("service", serviceName);
          body.append("_subject", "Inquiry: " + serviceName);

          fetch(FORMSPREE_ENDPOINT, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: body
          }).then(function (res) {
            if (res.ok) {
              showConfirm(form, "Thanks, " + (data.name.split(" ")[0] || "there") +
                " — that's been sent. We'll be in touch at " + data.email + ".");
              done();
            } else {
              fallbackToMailto(form, serviceName, data);
              done();
            }
          }).catch(function () {
            fallbackToMailto(form, serviceName, data);
            done();
          });
        });
      })(forms[i]);
    }
  }

  function respectReducedMotion() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var animates = document.querySelectorAll("animate");
      for (var i = 0; i < animates.length; i++) animates[i].remove();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initContactShortcuts();
    initLocalScroll();
    initCopyButtons();
    initForms();
    respectReducedMotion();
    route();
  });
})();
