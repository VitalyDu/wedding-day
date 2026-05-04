/* ============================================================
   Wedding invitation — Виталий & Гузаль
   Behaviour: countdown, scroll animations, RSVP modal,
   Telegram submission, palette interactions, back-to-top.
   ============================================================ */

(() => {
  "use strict";

  // ----------------------------------------------------------
  // CONFIG — заполните своими значениями
  // ----------------------------------------------------------
  // Создайте бота через @BotFather, вставьте сюда токен.
  // chat_id — id чата, куда бот будет писать (можно узнать у @userinfobot
  // или @getmyid_bot, переслав боту любое сообщение из нужного чата).
  const TELEGRAM_BOT_TOKEN = ""; // напр. "1234567890:AAH..."
  const TELEGRAM_CHAT_ID = ""; // напр. "123456789"

  const WEDDING_DATE = new Date("2026-09-12T15:00:00+03:00");

  // ----------------------------------------------------------
  // AOS init
  // ----------------------------------------------------------
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (window.AOS) {
    window.AOS.init({
      duration: reduceMotion ? 0 : 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 80,
      disable: reduceMotion,
    });
  }

  // ----------------------------------------------------------
  // Countdown
  // ----------------------------------------------------------
  const cdEls = {
    days: document.querySelector('[data-cd="days"]'),
    hours: document.querySelector('[data-cd="hours"]'),
    minutes: document.querySelector('[data-cd="minutes"]'),
    seconds: document.querySelector('[data-cd="seconds"]'),
  };

  const pad = (n) => String(Math.max(0, n)).padStart(2, "0");

  function tickCountdown() {
    const now = Date.now();
    const diff = WEDDING_DATE.getTime() - now;
    if (diff <= 0) {
      Object.values(cdEls).forEach((el) => el && (el.textContent = "00"));
      return false;
    }
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    const seconds = Math.floor((diff % 60_000) / 1000);
    if (cdEls.days) cdEls.days.textContent = String(days);
    if (cdEls.hours) cdEls.hours.textContent = pad(hours);
    if (cdEls.minutes) cdEls.minutes.textContent = pad(minutes);
    if (cdEls.seconds) cdEls.seconds.textContent = pad(seconds);
    return true;
  }
  if (cdEls.days) {
    tickCountdown();
    setInterval(tickCountdown, 1000);
  }

  // ----------------------------------------------------------
  // Timeline — draw line on scroll progress
  // ----------------------------------------------------------
  const timeline = document.getElementById("timeline");
  if (timeline) {
    const linePath = timeline.querySelector(".timeline__line path");
    const items = timeline.querySelectorAll(".timeline__item");

    if (linePath) {
      const len = linePath.getTotalLength();
      linePath.style.setProperty("--len", String(len));
      linePath.style.strokeDasharray = String(len);
      linePath.style.strokeDashoffset = String(len);

      const onScroll = () => {
        const rect = timeline.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const total = rect.height + vh * 0.5;
        const progressed = Math.min(
          Math.max(vh * 0.85 - rect.top, 0),
          total
        );
        const ratio = Math.min(progressed / total, 1);
        const offset = len * (1 - ratio);
        linePath.style.strokeDashoffset = String(offset);
      };

      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    }

    if (items.length) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.45 }
      );
      items.forEach((it) => io.observe(it));
    }
  }

  // ----------------------------------------------------------
  // Back to top
  // ----------------------------------------------------------
  const backBtn = document.querySelector("[data-back-to-top]");
  if (backBtn) {
    const toggleBack = () => {
      const show = window.scrollY > window.innerHeight * 0.6;
      backBtn.classList.toggle("is-visible", show);
    };
    toggleBack();
    window.addEventListener("scroll", toggleBack, { passive: true });
    backBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  // ----------------------------------------------------------
  // RSVP modal
  // ----------------------------------------------------------
  const modal = document.getElementById("rsvp-modal");
  const modalContent = modal?.querySelector("[data-rsvp-content]");
  const modalSuccess = modal?.querySelector("[data-rsvp-success]");
  let lastFocused = null;
  let successCloseTimer = null;

  function openModal() {
    if (!modal) return;
    if (successCloseTimer) {
      window.clearTimeout(successCloseTimer);
      successCloseTimer = null;
    }
    lastFocused = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      const firstField = modal.querySelector("input, button");
      firstField?.focus();
    }, 60);
  }

  function closeModal() {
    if (!modal) return;
    if (successCloseTimer) {
      window.clearTimeout(successCloseTimer);
      successCloseTimer = null;
    }
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
    setTimeout(() => {
      if (modalContent && modalSuccess) {
        modalContent.hidden = false;
        modalSuccess.hidden = true;
      }
    }, 300);
  }

  document.querySelectorAll("[data-rsvp-open]").forEach((b) =>
    b.addEventListener("click", openModal)
  );
  document.querySelectorAll("[data-rsvp-close]").forEach((b) =>
    b.addEventListener("click", closeModal)
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("is-open")) {
      closeModal();
    }
  });

  // ----------------------------------------------------------
  // RSVP form
  // ----------------------------------------------------------
  const form = document.getElementById("rsvp-form");
  if (form) {
    const abstainCb = form.querySelector("[data-abstain]");
    const customToggle = form.querySelector("[data-custom-toggle]");
    const customField = form.querySelector("[data-custom-field]");
    const customInput = customField?.querySelector("input");
    const drinkChecks = form.querySelectorAll('input[name="drinks"]');
    const submitBtn = form.querySelector('button[type="submit"]');
    const submitLabel = form.querySelector("[data-submit-label]");
    const formError = form.querySelector("[data-form-error]");

    // "Я не пью" disables all drinks
    abstainCb?.addEventListener("change", () => {
      const off = abstainCb.checked;
      drinkChecks.forEach((cb) => {
        if (off) cb.checked = false;
        cb.disabled = off;
        cb.closest(".check")?.classList.toggle("is-disabled", off);
      });
      if (off && customToggle) {
        customToggle.checked = false;
        if (customField) customField.hidden = true;
        customToggle.closest(".check")?.classList.add("is-disabled");
        customToggle.disabled = true;
      } else if (customToggle) {
        customToggle.disabled = false;
        customToggle.closest(".check")?.classList.remove("is-disabled");
      }
    });

    // toggle custom field
    customToggle?.addEventListener("change", () => {
      if (!customField) return;
      customField.hidden = !customToggle.checked;
      if (customToggle.checked) customInput?.focus();
    });

    // validation helper
    const fullNameInput = form.querySelector("#fullName");
    const fullNameError = form.querySelector('[data-error-for="fullName"]');

    function validate() {
      const v = (fullNameInput?.value || "").trim();
      const words = v.split(/\s+/).filter(Boolean);
      const ok = words.length >= 2;
      const wrap = fullNameInput?.closest(".field");
      if (!ok) {
        wrap?.classList.add("is-error");
        if (fullNameError)
          fullNameError.textContent =
            "Укажите имя и фамилию (два слова)";
      } else {
        wrap?.classList.remove("is-error");
        if (fullNameError) fullNameError.textContent = "";
      }
      return ok;
    }
    fullNameInput?.addEventListener("input", () => {
      if (fullNameInput.closest(".field")?.classList.contains("is-error")) {
        validate();
      }
    });

    function buildMessage(data) {
      const parts = [];
      parts.push("🤍 <b>Новый гость подтвердил участие</b>");
      parts.push(`<b>Имя:</b> ${escapeHtml(data.fullName)}`);
      if (data.drinks.length) {
        parts.push(`<b>Напитки:</b> ${escapeHtml(data.drinks.join(", "))}`);
      }
      if (data.customDrink) {
        parts.push(`<b>Свой вариант:</b> ${escapeHtml(data.customDrink)}`);
      }
      if (data.abstain) {
        parts.push("<b>Алкоголь:</b> не пьёт");
      }
      parts.push(
        `<i>Отправлено ${new Date().toLocaleString("ru-RU", {
          dateStyle: "short",
          timeStyle: "short",
        })}</i>`
      );
      return parts.join("\n");
    }

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    async function sendToTelegram(data) {
      if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        // No credentials yet — pretend success and log to console for development.
        console.info(
          "[RSVP] (no telegram credentials configured)",
          JSON.stringify(data)
        );
        await new Promise((r) => setTimeout(r, 600));
        return { ok: true, simulated: true };
      }
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: buildMessage(data),
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        throw new Error(json.description || `HTTP ${res.status}`);
      }
      return json;
    }

    function showSuccess() {
      if (modalContent) modalContent.hidden = true;
      if (modalSuccess) modalSuccess.hidden = false;
      successCloseTimer = window.setTimeout(() => {
        successCloseTimer = null;
        closeModal();
      }, 4000);
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (formError) {
        formError.hidden = true;
        formError.textContent = "";
      }
      if (!validate()) {
        fullNameInput?.focus();
        return;
      }

      const drinks = Array.from(drinkChecks)
        .filter((cb) => cb.checked && !cb.disabled)
        .map((cb) => cb.value);
      const data = {
        fullName: fullNameInput.value.trim(),
        drinks,
        abstain: !!abstainCb?.checked,
        customDrink:
          customToggle?.checked && customInput?.value
            ? customInput.value.trim()
            : "",
      };

      submitBtn?.setAttribute("disabled", "disabled");
      const prevLabel = submitLabel?.textContent;
      if (submitLabel) submitLabel.textContent = "Отправляем…";

      try {
        await sendToTelegram(data);
        showSuccess();
        form.reset();
        if (customField) customField.hidden = true;
        drinkChecks.forEach((cb) => {
          cb.disabled = false;
          cb.closest(".check")?.classList.remove("is-disabled");
        });
        if (customToggle) {
          customToggle.disabled = false;
          customToggle.closest(".check")?.classList.remove("is-disabled");
        }
      } catch (err) {
        console.error("[RSVP] send error", err);
        if (formError) {
          formError.hidden = false;
          formError.textContent =
            "Не получилось отправить. Попробуйте ещё раз или напишите нам напрямую.";
        }
      } finally {
        submitBtn?.removeAttribute("disabled");
        if (submitLabel && prevLabel) submitLabel.textContent = prevLabel;
      }
    });
  }

  // ----------------------------------------------------------
  // Palette tap (mobile): briefly show name on tap as well
  // ----------------------------------------------------------
  document.querySelectorAll(".palette__item").forEach((item) => {
    item.addEventListener("click", () => {
      item.classList.add("is-tap");
      setTimeout(() => item.classList.remove("is-tap"), 1500);
    });
  });
})();
