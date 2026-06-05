"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, Download, ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea, Select, Label } from "@/components/ui/input";
import { SetupNotice } from "@/components/setup-notice";
import { LoadingState } from "@/components/ui/states";
import { generateMedia, type MediaResult } from "./actions";

export function MediaClient() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Photorealistic");
  const [aspect, setAspect] = useState("square");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MediaResult | null>(null);

  async function onGenerate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResult(null);
    const res = await generateMedia({ prompt, style, aspect });
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-4">
        <div>
          <Label htmlFor="prompt">Describe your image</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A vibrant flat-lay of summer skincare products on a marble surface with tropical leaves"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="style">Style</Label>
            <Select id="style" value={style} onChange={(e) => setStyle(e.target.value)}>
              <option>Photorealistic</option>
              <option>3D render</option>
              <option>Flat illustration</option>
              <option>Minimalist</option>
              <option>Watercolor</option>
              <option>Cinematic</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="aspect">Aspect</Label>
            <Select id="aspect" value={aspect} onChange={(e) => setAspect(e.target.value)}>
              <option value="square">Square (1:1)</option>
              <option value="landscape">Landscape (16:9)</option>
              <option value="portrait">Portrait (9:16)</option>
            </Select>
          </div>
        </div>
        <Button onClick={onGenerate} loading={loading} className="w-full">
          {!loading && <Sparkles className="h-4 w-4" />}
          Generate image
        </Button>
      </Card>

      <div>
        {loading && (
          <Card>
            <LoadingState label="Creating your image… this can take ~15s" />
          </Card>
        )}
        {!loading && !result && (
          <Card className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ImageIcon className="h-7 w-7" />
            </span>
            <p className="mt-4 font-semibold text-foreground">Your image appears here</p>
          </Card>
        )}
        {!loading && result && !result.ok && (
          <Card>
            {result.setup ? (
              <SetupNotice service="OpenAI" hint="Add OPENAI_API_KEY to enable AI image generation." />
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-error/10 p-4 text-sm text-error">{result.error}</div>
                {result.upgrade && (
                  <Button href="/dashboard/billing" className="w-full">Upgrade plan</Button>
                )}
              </div>
            )}
          </Card>
        )}
        {!loading && result?.ok && result.url && (
          <Card className="space-y-3">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border">
              <Image src={result.url} alt="Generated marketing visual" fill className="object-cover" unoptimized />
            </div>
            <Button href={result.url} external variant="secondary" className="w-full">
              <Download className="h-4 w-4" /> Open / download
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
