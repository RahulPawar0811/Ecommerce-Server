const mysql = require("mysql2/promise");
const {connectDatabase, dbConfig} = require("../Config/dbConfig");

const viewSales = async (req, res) => {
    const Org_Id = req.params.Org_Id;
    const { month, year } = req.query;

    try {
        const connection = await mysql.createConnection(dbConfig);

        let query = `
            SELECT 
                MONTH(Ordered_On) AS Month, 
                YEAR(Ordered_On) AS Year, 
                SUM(Amount) AS Total_Sales
            FROM 
                Order_Details
            WHERE 
                Org_Id = ?
        `;

        let queryParams = [Org_Id];

        if (month && year) {
            query += ` AND MONTH(Ordered_On) = ? AND YEAR(Ordered_On) = ?`;
            queryParams.push(month, year);
        }

        query += ` 
            GROUP BY YEAR(Ordered_On), MONTH(Ordered_On)
            ORDER BY YEAR(Ordered_On) ASC, MONTH(Ordered_On) ASC
        `;

        const [rows] = await connection.execute(query, queryParams);
        await connection.end();

        res.json(rows);
    } catch (error) {
        console.error("Error fetching sales data:", error);
        res.status(500).send("Error fetching sales data");
    }
};

const viewYears = async (req, res) => {
    const Org_Id = req.params.Org_Id;

    if (!Org_Id || isNaN(Org_Id)) {
        return res.status(400).send("Invalid Org_Id");
    }

    try {
        const connection = await mysql.createConnection(dbConfig);

        const query = `
            SELECT DISTINCT YEAR(Ordered_On) AS Year
            FROM Order_Details
            WHERE Org_Id = ?
            ORDER BY Year ASC
        `;

        const [rows] = await connection.execute(query, [Org_Id]);
        await connection.end();

        const startYear = 2024;
        const currentYear = new Date().getFullYear();

        let years = rows.map((record) => record.Year);

        for (let year = startYear; year <= currentYear; year++) {
            if (!years.includes(year)) {
                years.push(year);
            }
        }

        years.sort((a, b) => a - b);
        res.json(years.map((year) => ({ Year: year })));
    } catch (error) {
        console.error("Error fetching years data:", error);
        res.status(500).send("Error fetching years data");
    }
};

const viewStatus = async (req, res) => {
    const Org_Id = req.params.Org_Id;
    const { month, year } = req.query;

    try {
        const connection = await mysql.createConnection(dbConfig);

        let query = `
            SELECT Order_Status, Ordered_On
            FROM Order_Details
            WHERE Org_Id = ?
        `;

        let queryParams = [Org_Id];

        if (month) {
            query += ` AND MONTH(Ordered_On) = ?`;
            queryParams.push(month);
        }
        if (year) {
            query += ` AND YEAR(Ordered_On) = ?`;
            queryParams.push(year);
        }

        query += ` ORDER BY Ordered_On DESC`;

        const [rows] = await connection.execute(query, queryParams);
        await connection.end();

        res.json(rows.map(order => ({
            Order_Status: order.Order_Status,
            Ordered_On: order.Ordered_On
        })));
    } catch (error) {
        console.error("Error fetching order statuses:", error);
        res.status(500).send("Error fetching order statuses");
    }
};

const viewCustomers = async (req, res) => {
    const Org_Id = req.params.Org_Id;
    const { year } = req.query;

    try {
        const connection = await mysql.createConnection(dbConfig);

        let query = `
            SELECT MONTH(Added_on) AS Month, YEAR(Added_on) AS Year, COUNT(*) AS CustomerCount
            FROM User_Master
            WHERE Org_Id = ?
        `;

        let queryParams = [Org_Id];

        if (year) {
            query += ` AND YEAR(Added_on) = ?`;
            queryParams.push(year);
        }

        query += `
            GROUP BY MONTH(Added_on), YEAR(Added_on)
            ORDER BY YEAR(Added_on), MONTH(Added_on)
        `;

        const [rows] = await connection.execute(query, queryParams);
        await connection.end();

        res.json(rows);
    } catch (error) {
        console.error("Error fetching customer count:", error);
        res.status(500).send("Internal Server Error");
    }
};

const viewCustomersYears = async (req, res) => {
    const Org_Id = req.params.Org_Id;

    if (!Org_Id || isNaN(Org_Id)) {
        return res.status(400).json({ error: "Invalid Org_Id. It must be a number." });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);

        const query = `
            SELECT DISTINCT YEAR(Added_on) AS Year
            FROM User_Master
            WHERE Added_on IS NOT NULL AND Org_Id = ?
            ORDER BY Year DESC
        `;

        const [rows] = await connection.execute(query, [Org_Id]);
        await connection.end();

        res.json(rows.map(row => row.Year));
    } catch (error) {
        console.error("Error fetching available years:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const viewFollowupDates = async (req, res) => {
    const Org_Id = req.params.Org_Id;

    if (!Org_Id || isNaN(Org_Id)) {
        return res.status(400).json({ error: "Invalid Org_Id. It must be a number." });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);

        const query = `
            SELECT 
                cu.Name, 
                cu.Next_Followup_Date, 
                cu.Followup_Status,
                (SELECT lf.Remarks
                 FROM lead_Followup lf
                 WHERE lf.lead_Id = cu.Row_Id 
                 ORDER BY lf.Remarks LIMIT 1) AS Remarks
            FROM Contact_Us cu
            WHERE cu.Followup_Status IN ('Pending', 'Follow-Up')
              AND cu.Org_Id = ?
        `;

        const [rows] = await connection.execute(query, [Org_Id]);
        await connection.end();

        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching follow-up data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    viewSales,
    viewStatus,
    viewYears,
    viewCustomers,
    viewCustomersYears,
    viewFollowupDates
};
