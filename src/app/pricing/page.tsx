import Link from "next/link";
import { Check, Twitter, Linkedin } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">Omakase.ai</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-300">
            <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/pricing" className="text-white">Pricing</Link>
            <Link href="/#partnerships" className="hover:text-white transition-colors">Partnerships</Link>
            <Link href="/#resources" className="hover:text-white transition-colors">Resources</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors hidden md:block">
              Log in
            </Link>
            <Link
              href="/login"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-5 py-2.5 rounded-full text-sm transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Choose the Perfect Plan for Your Business
            </h1>

            {/* Monthly/Yearly Toggle */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <span className="text-gray-400">Monthly</span>
              <button className="relative w-14 h-7 bg-cyan-500 rounded-full p-1 transition-colors">
                <div className="w-5 h-5 bg-white rounded-full transform translate-x-7" />
              </button>
              <span className="text-white">Yearly</span>
              <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-1 rounded-full">Save 20%</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Intern Plan */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center overflow-hidden">
                  <span className="text-lg">👤</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">50+ Products</span>
                  <h3 className="text-xl font-semibold">Intern</h3>
                </div>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">49$</span>
                <span className="text-gray-400">/month</span>
              </div>
              <Link href="/login" className="block w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-full text-center transition-colors mb-6">
                Start your 1 week free trial
              </Link>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Hybrid Voice & Chat Support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Shopify Integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>1 Agent Type</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>5 Distinct Voice Types</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Up to 50 conversations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Up to 10 Products</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Email Support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Basic Analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Customizable Interface</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>AI Training on Knowledge Base & Custom Rules</span>
                </li>
              </ul>
            </div>

            {/* Associate Plan - Most Popular */}
            <div className="bg-gradient-to-b from-cyan-500/20 to-transparent border-2 border-cyan-500 rounded-3xl p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-xs font-semibold px-4 py-1 rounded-full">
                Most Popular
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center overflow-hidden">
                  <span className="text-lg">⭐</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">100+ Products</span>
                  <h3 className="text-xl font-semibold">Associate</h3>
                </div>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">149$</span>
                <span className="text-gray-400">/month</span>
              </div>
              <Link href="/login" className="block w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-3 rounded-full text-center transition-colors mb-6">
                Start your 1 week free trial
              </Link>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Hybrid Voice & Chat Support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Shopify Integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>2 Agent Types</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>10 Distinct Voice Types</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Up to 300 conversations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Up to 100 Products</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Email + Phone Support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Advanced Analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Fully Customizable Interface</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Branded AI Training via Knowledge Base & Custom Rules</span>
                </li>
              </ul>
            </div>

            {/* Principal Plan */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center overflow-hidden">
                  <span className="text-lg">💎</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">500+ Products</span>
                  <h3 className="text-xl font-semibold">Principal</h3>
                </div>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">399$</span>
                <span className="text-gray-400">/month</span>
              </div>
              <Link href="/login" className="block w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-full text-center transition-colors mb-6">
                Start your 1 week free trial
              </Link>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Hybrid Voice & Chat Support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Shopify Integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>3 Agent Types</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>10 Distinct Voice Types</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Up to 1,000 conversations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Up to 500 Products</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Email + Phone + Meeting Support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Advanced Analytics including Lead Capture</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Fully Customizable Interface</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Remove &quot;powered by&quot;</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Add to Cart Function in Shopify</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Unlimited AI Training on Knowledge Base & Custom Rules</span>
                </li>
              </ul>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center overflow-hidden">
                  <span className="text-lg">🏆</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">1000+ Products</span>
                  <h3 className="text-xl font-semibold">Enterprise</h3>
                </div>
              </div>
              <div className="mb-6">
                <span className="text-2xl font-bold">Custom Plan</span>
              </div>
              <Link href="mailto:omakase@zodia.ai" className="block w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-full text-center transition-colors mb-6">
                Contact Us
              </Link>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Hybrid Voice & Chat Support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Shopify Integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>10+ Revenue Agent Types</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>15+ Premium Character Voice Types, Tailored To Your Brand</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>1000+ Products</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Support Tailored To Your Preferred Communication Channel</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Advanced Analytics including Lead Capture and Call Routing Implementation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Fully Customizable Interface</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Remove &quot;Powered by&quot;</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>API & Call Button Implementation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Unlimited AI Training on Knowledge Base & Custom Rules</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 border-t border-white/10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">
            Have an inquiry? Reach out to us at{" "}
            <a href="mailto:omakase@zodia.ai" className="text-cyan-400 hover:underline">
              omakase@zodia.ai
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <span className="text-xl font-semibold tracking-tight">Omakase.ai</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link href="#" className="hover:text-white transition-colors">Omakase website</Link>
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">FAQ</Link>
              <Link href="#" className="hover:text-white transition-colors">Developers</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="https://twitter.com" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="https://linkedin.com" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-gray-500 text-xs">
              © 2025 Omakase.ai. All rights reserved. <span className="ml-2">Become an affiliate</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
