"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/auth/authContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [response, setResponse] = useState(null);
  let isDisabled = !email.trim() || !password.trim();

  const loginData = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (error) {
      alert("Login failed");
    }
  };

  const postData = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/login", {
        email: email,
        password: password,
      });
      setResponse(res.data);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.log(err.message);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  if (loading || isAuthenticated){
    return <p>...</p>
  }

  return (
    <main className="container flex-auto justify-center mx-auto py-8 px4">
      <header className="flex justify-end mb-8 w-1/2">
        <Link href="/">
          <Button variant="outline" size="icon" className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Вход</h1>
      </header>
      {response &&
        (response.status == 1 ? (
          <div className="mb-3 max-w-md mx-[33.5%] text-white border-2 p-2 border rounded-xl border-black bg-lime-500">
            <pre>{JSON.stringify(response.message, null, 2)}</pre>
          </div>
        ) : (
          <div className="mb-3 max-w-md mx-[33.5%] text-white border-2 p-2 border rounded-xl border-black bg-rose-600">
            Ошибка:
            <pre>{JSON.stringify(response.message, null, 2)}</pre>
          </div>
        ))}
      <div className="max-w-md lg:mx-[33%] md:mx-[15%] mx-[10%]">
        <Card className="">
          <CardHeader></CardHeader>
          <CardContent>
            <div className="grid grid-row-5 gap-5">
              <span className="text-xl">Введите Email:</span>
              <Input
                value={email}
                type="email"
                onChange={(event) => setEmail(event.target.value)}
              ></Input>
              <span className="text-xl">Введите password:</span>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              ></Input>
              <Button type="submit" disabled={isDisabled} onClick={loginData}>
                Войти
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
