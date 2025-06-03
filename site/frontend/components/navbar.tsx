"use client";
import Link from "next/link";
import { ThemeSwitcher } from "./theme-switcher";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/authContext";

export function Navbar() {
  const { isAuthenticated } = useAuth();
  return (
    <header className="border-b">
      <div className="container mx-auto py-3 px-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Python Learning
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/compiler" className="hover:underline">
            Компилятор
          </Link>
          {isAuthenticated ? (
              <Link href="/profile">
                <Button className="w-full h-10">Профиль</Button>
              </Link>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Link href="/login">
                <Button className="w-full h-10">Вход</Button>
              </Link>
              <Link href="/register">
                <Button className="w-full h-10">Регистрация</Button>
              </Link>
            </div>
          )}
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
