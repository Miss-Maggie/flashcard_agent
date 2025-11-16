const Header = () => {
  return (
    <header className="w-full border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center gap-2">
            FlashCard Agent ☕
          </h1>
          <p className="text-sm md:text-base text-muted-foreground text-center">
            Learn Anything, Anywhere — Smart Flashcards & Adaptive Quizzes
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
