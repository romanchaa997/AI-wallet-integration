export const PORT = process.env.PORT || 5000;

export const corsOptions = {
    origin: '*', // 🔹 Краще вказати конкретний домен
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
