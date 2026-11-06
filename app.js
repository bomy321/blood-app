const STORAGE_KEY = "blood-pressure-records";

const form = document.querySelector("#record-form");
const recordsList = document.querySelector("#records-list");
const recordCount = document.querySelector("#record-count");
const formMessage = document.querySelector("#form-message");

function showMessage(message) {
  formMessage.textContent = message;
  formMessage.hidden = false;
}

function clearMessage() {
  formMessage.textContent = "";
  formMessage.hidden = true;
}

function loadRecords() {
  try {
    const storedRecords = localStorage.getItem(STORAGE_KEY);
    if (!storedRecords) return [];

    const records = JSON.parse(storedRecords);
    if (!Array.isArray(records)) {
      throw new Error("紀錄資料格式不正確。");
    }

    return records;
  } catch (error) {
    console.error("無法讀取血壓紀錄：", error);
    showMessage("無法讀取已儲存的紀錄，請確認瀏覽器儲存空間是否可用。");
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function createMeasurement(value, label) {
  const wrapper = document.createElement("div");
  wrapper.className = "record-measurement";
  wrapper.append(
    createTextElement("strong", "", value),
    createTextElement("small", "", label),
  );
  return wrapper;
}

function renderRecords(records) {
  recordsList.replaceChildren();
  recordCount.textContent = `${records.length} 筆紀錄`;

  if (records.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.append(
      createTextElement("span", "", "♡"),
      document.createTextNode("目前還沒有紀錄，新增第一筆血壓資料吧。"),
    );
    recordsList.append(emptyState);
    return;
  }

  const sortedRecords = [...records].sort(
    (first, second) => new Date(second.createdAt) - new Date(first.createdAt),
  );

  sortedRecords.forEach((record) => {
    const card = document.createElement("article");
    card.className = "record-card";

    const date = new Date(record.createdAt);
    const dateElement = document.createElement("div");
    dateElement.className = "record-date";
    dateElement.append(
      createTextElement(
        "div",
        "",
        new Intl.DateTimeFormat("zh-TW", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(date),
      ),
      createTextElement(
        "span",
        "",
        new Intl.DateTimeFormat("zh-TW", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(date),
      ),
    );

    const medication = createTextElement(
      "span",
      "medication-tag",
      record.medication,
    );
    medication.dataset.status = record.medication;

    card.append(
      dateElement,
      createMeasurement(`${record.systolic} / ${record.diastolic}`, "收縮壓 / 舒張壓"),
      createMeasurement(record.pulse, "脈搏／分鐘"),
      medication,
    );

    if (record.notes) {
      card.append(createTextElement("p", "record-notes", `備註：${record.notes}`));
    }

    recordsList.append(card);
  });
}

let records = loadRecords();
renderRecords(records);

form.addEventListener("input", clearMessage);
form.addEventListener("change", clearMessage);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearMessage();

  const formData = new FormData(form);
  const systolic = Number(formData.get("systolic"));
  const diastolic = Number(formData.get("diastolic"));
  const pulse = Number(formData.get("pulse"));

  if (![systolic, diastolic, pulse].every(Number.isInteger)) {
    showMessage("請輸入有效的整數數值。");
    return;
  }

  if (systolic <= diastolic) {
    showMessage("收縮壓必須高於舒張壓，請檢查輸入數值。");
    return;
  }

  const record = {
    systolic,
    diastolic,
    pulse,
    medication: formData.get("medication"),
    notes: formData.get("notes").trim(),
    createdAt: new Date().toISOString(),
  };

  const updatedRecords = [...records, record];
  try {
    saveRecords(updatedRecords);
  } catch (error) {
    console.error("無法儲存血壓紀錄：", error);
    showMessage("儲存失敗，請確認瀏覽器儲存空間是否可用。");
    return;
  }

  records = updatedRecords;
  renderRecords(records);
  form.reset();
  form.elements.systolic.focus();
});
