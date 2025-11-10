import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Logo */}
      <div className="absolute top-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <span className="text-2xl font-semibold text-gray-800">
            Bram Inc.
          </span>
        </div>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md mx-4 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Selamat Datang</CardTitle>
          <CardDescription className="text-base pt-0.5">
            Silahkan Masuk dengan Akunmu
          </CardDescription>
          <div className="border-t pt-2 mx-auto w-80"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Username"
              defaultValue=""
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              defaultValue=""
              className="h-12"
            />
          </div>
          <Button className="w-full h-12 text-base bg-black hover:bg-gray-800 mt-6">
            Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
