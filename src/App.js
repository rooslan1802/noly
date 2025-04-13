import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import "./App.css";

function App() {
  const [data, setData] = useState([]);
  const [log, setLog] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [progress, setProgress] = useState(0);
  const [successfulRecords, setSuccessfulRecords] = useState([]);
  const [scrollToBottom, setScrollToBottom] = useState(true);

  const topRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const bottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 10;
      setScrollToBottom(!bottom);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const json = XLSX.utils.sheet_to_json(ws);
      setData(json);
    };
    reader.readAsBinaryString(file);
  };

  const getTime = () => {
    const now = new Date();
    return now.toLocaleString("ru-RU", { hour12: false }) + `.${now.getMilliseconds()}`;
  };

  const getToken = async (iin, password) => {
    try {
      const res = await fetch("https://damubala.kz/v1/Account/SignIn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iin, password }),
      });
      const result = await res.json();
      return result.token?.token || null;
    } catch {
      return null;
    }
  };

  const updateQueue = async (token, childId, classId, courseId) => {
    const url = `https://damubala.kz/v1/LinePosition/UpdateQueueV2?childId=${childId}&classId=${classId}&courseId=${courseId}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return res.status === 200 || res.status === 202;
  };

  const handleProcess = async () => {
    setProcessing(true);
    setLog([]);
    setSuccessfulRecords([]);
    setStartTime(getTime());
    setEndTime(null);
    let successList = [];
    let tempLog = [];
    let successfulCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const { login, password, childId, classId, courseId, childName } = row;
      const token = await getToken(login, password);
      const time = getTime();
      let status = "";

      if (token) {
        const success = await updateQueue(token, childId, classId, courseId);
        if (success) {
          successList.push({ childName, login, time });
          status = "Успешно";
          successfulCount++;
        } else {
          status = "Ошибка записи";
        }
      } else {
        status = "Ошибка авторизации";
      }

      tempLog.push({ childId, classId, courseId, childName, login, status, time });
      setLog(tempLog); // обновляем журнал записей
      setProgress(((i + 1) / data.length) * 100); // обновляем прогресс

      // обновляем количество записанных детей
      setSuccessfulRecords(successList);
    }

    setEndTime(getTime());
    setProcessing(false);
  };

  const handleScrollButtonClick = () => {
    if (scrollToBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div style={{ backgroundColor: "#0b1a2e", color: "#ffffff", minHeight: "100vh", fontFamily: "Arial, sans-serif", padding: "1rem" }}>
      <div ref={topRef}></div>


      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <progress value={progress} max="100" style={{ width: "60%", height: "20px" }} />
        <div style={{ marginTop: "0.5rem" }}>Записано детей: {successfulRecords.length} / {data.length}</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ padding: "0.5rem" }} />
        <button onClick={handleProcess} disabled={processing || !data.length} style={{ padding: "0.5rem 1rem", backgroundColor: "#1e90ff", border: "none", color: "white", cursor: processing ? "not-allowed" : "pointer" }}>
          {processing ? "Идёт запись..." : "Записать"}
        </button>
      </div>

      <div style={{ display: "flex", gap: "2rem" }}>
        <div style={{ flex: 1, backgroundColor: "#173b5c", padding: "1rem", borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {data[0] && Object.keys(data[0]).map((key) => (
                  <th key={key} style={{ border: "1px solid #fff", padding: "0.5rem", backgroundColor: "#0f2b45" }}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.values(row).map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      style={{
                        border: "1px solid #fff",
                        padding: "0.5rem",
                        color:
                          log[rowIndex]?.status === "Успешно"
                            ? "#00ff99"
                            : log[rowIndex]?.status?.startsWith("Ошибка")
                            ? "#ff4d4d"
                            : "#fff",
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1, backgroundColor: "#173b5c", padding: "1rem", borderRadius: "8px" }}>
          <h3>🧾 Отчет</h3>
          <p>⏱ Начало записи: {startTime}</p>
          <p>⏱ Конец записи: {endTime}</p>
          <p>✅ Успешно записано: {successfulRecords.length}</p>
          <p>❌ Не удалось записать: {log.length - successfulRecords.length}</p>
          <ul>
            {log.filter((entry) => entry.status !== "Успешно").map((entry, index) => (
              <li key={index} style={{ color: "#ff4d4d" }}>
                {entry.childName} ({entry.login}) — {entry.status} — {entry.time}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div ref={bottomRef} style={{ marginTop: "2rem" }}></div>
      <button
        onClick={handleScrollButtonClick}
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          backgroundColor: "#1e90ff",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: "20px",
        }}
      >
        {scrollToBottom ? <FaArrowDown /> : <FaArrowUp />}
      </button>
    </div>
  );
}

export default App;
