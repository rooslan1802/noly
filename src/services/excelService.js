import axios from "axios";
// excelService.js
import { readFile, utils } from 'xlsx';

// Функция для загрузки данных из Excel
function loadExcelFile(filename) {
    const workbook = readFile(filename);
    const sheetName = workbook.SheetNames[0];
    const data = utils.sheet_to_json(workbook.Sheets[sheetName]);
    return data;
}

export { loadExcelFile };


// Функция для получения токена
async function getToken(iin, password) {
    const url = "https://damubala.kz/v1/Account/SignIn";
    const credentials = { iin, password };

    try {
        const response = await axios.post(url, credentials, {
            headers: { "Content-Type": "application/json" },
            validateStatus: () => true
        });

        if (response.status === 200 || response.status === 202) {
            return response.data.token?.token;
        }
    } catch (error) {
        console.log(`Ошибка авторизации для ${iin}: ${error.message}`);
    }
    return null;
}

// Функция для записи ребенка
async function updateQueue(token, childId, classId, courseId) {
    const url = `https://damubala.kz/v1/LinePosition/UpdateQueueV2?childId=${childId}&classId=${classId}&courseId=${courseId}`;

    try {
        const response = await axios.post(url, {}, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            validateStatus: () => true
        });

        if (response.status === 200 || response.status === 202) {
            return { childId, status: "success" };
        } else {
            return { childId, status: "already_registered" };
        }
    } catch (error) {
        return { childId, status: "error", error: error.message };
    }
}

// Основная функция обработки данных
export async function processExcelData(file) {
    const data = await loadExcelFile(file);

    const results = [];

    for (const row of data) {
        const { login, password, childId, classId, courseId } = row;

        const token = await getToken(login, password);
        if (token) {
            const result = await updateQueue(token, childId, classId, courseId);
            results.push(result);
        }
    }

    return results;
}
