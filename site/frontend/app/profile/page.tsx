"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/authContext";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const { user } = useAuth()
  const username = user?.username
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="md:mx-[15%] mx-[10%]">
        <Card className="">
          <CardHeader className="">
            <Image className="rounded-md border-4" src={"https://assets.leetcode.com/users/avatars/avatar_1678735489.png"} alt="Аватар" width={70} height={70}></Image>
            <span className="text-3xl">{ username }</span>
          </CardHeader>
          <CardContent>
            <Card>
              <CardHeader>
                <span className="text-3xl">Задачи</span>
                <CardContent>
                  <span className="flex justify-center">У вас пока не выполнено не одной задачи...</span>
                </CardContent>
              </CardHeader>
            </Card>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
