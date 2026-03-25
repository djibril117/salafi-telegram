export const metadata = {
    title: 'Salafi Telegram Bot',
    description: 'Publications islamiques automatiques',
};

export default function RootLayout({ children }) {
    return (
          <html lang="fr">
            <body>{children}</body>
      </html>
    );
}
