"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect} from "react";
import axios, { AxiosResponse, AxiosError } from "axios";
import { useAuth } from "@/auth/authContext"
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const EMAIL_REGEXP =
    /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/iu;
  let isDisabled =
    !password.trim() ||
    !username.trim() ||
    !email.trim() ||
    !repeatPassword.trim;
  const isEquel = !(password == repeatPassword);
  const isEmailValid = (value: string) => {
    return EMAIL_REGEXP.test(value);
  };

  const postData = async () => {
    setUsername("");
    setPassword("");
    setEmail("");
    setRepeatPassword("");
    if (password == repeatPassword) {
      try {
        const res: AxiosResponse<User> = await axios.post<User>(
          "http://localhost:2010/api/add_user",
          {
            email: email,
            username: username,
            password: password,
          }
        );
        setResponse(res.data);
        setError(null);
      } catch (err) {
        console.log(err.message);
      }
    } else {
      const res = { message: "Пароли не совпадают" };
      setResponse(res);
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
        <h1 className="text-3xl font-bold">Регистрация</h1>
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
      <div className="max-w-md mx-[33.5%]">
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
              {!(isEmailValid(email) || email == "")
                ? (isDisabled = true) && (
                    <div className="mb-3 text-white p-2 rounded-xl bg-rose-600">
                      <span>Некорректный E-Mail</span>
                    </div>
                  )
                : null}
              <span className="text-xl">Введите username:</span>
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              ></Input>
              <span className="text-xl">Введите password:</span>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              ></Input>
              <span className="text-xl">Введите password повторно:</span>
              <Input
                type="password"
                value={repeatPassword}
                onChange={(event) => setRepeatPassword(event.target.value)}
              ></Input>
              {isEquel
                ? (isDisabled = true) && (
                    <div className="mb-3 text-white p-2  rounded-xl bg-rose-600">
                      <span>Пароли не совпадают</span>
                    </div>
                  )
                : null}
              <Button type="submit" disabled={isDisabled} onClick={postData}>
                Продолжить
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
