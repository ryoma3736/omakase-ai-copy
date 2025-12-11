"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { PLANS, PlanType } from "@/lib/stripe";

function BillingContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const [isLoading, setIsLoading] = useState<PlanType | null>(null);

  const handleCheckout = async (planType: PlanType) => {
    if (planType === "free") return;

    setIsLoading(planType);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      });

      if (!response.ok) throw new Error("Failed to create checkout session");

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsLoading(null);
    }
  };

  const handlePortal = async () => {
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error === "No subscription found") {
          alert("有効なサブスクリプションがありません");
          return;
        }
        throw new Error("Failed to create portal session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Portal error:", error);
      alert("エラーが発生しました");
    }
  };

  const planKeys = Object.keys(PLANS) as PlanType[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">料金プラン</h1>
        <p className="text-muted-foreground">
          ビジネスに合ったプランをお選びください
        </p>
      </div>

      {/* Status messages */}
      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <p className="text-green-800">
              サブスクリプションが正常に開始されました！
            </p>
          </CardContent>
        </Card>
      )}

      {canceled && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-yellow-800">
              チェックアウトがキャンセルされました
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pricing grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {planKeys.map((planKey) => {
          const plan = PLANS[planKey];
          const isPopular = planKey === "associate";

          return (
            <Card
              key={planKey}
              className={`relative ${
                isPopular ? "border-primary shadow-lg" : ""
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    人気
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="text-center pb-4">
                <div className="mb-4">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? "無料" : `¥${plan.price.toLocaleString()}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">/月</span>
                  )}
                </div>

                <ul className="space-y-2 text-sm text-left">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isPopular ? "default" : "outline"}
                  onClick={() => handleCheckout(planKey)}
                  disabled={isLoading !== null || planKey === "free"}
                >
                  {isLoading === planKey ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      処理中...
                    </>
                  ) : planKey === "free" ? (
                    "現在のプラン"
                  ) : (
                    <>
                      このプランを選択
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Manage subscription */}
      <Card>
        <CardHeader>
          <CardTitle>サブスクリプション管理</CardTitle>
          <CardDescription>
            支払い方法の変更やプランのキャンセルができます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handlePortal}>
            Stripeカスタマーポータルを開く
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
