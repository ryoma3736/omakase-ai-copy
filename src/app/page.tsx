import Link from "next/link";
import { ChevronRight, Play, Globe, MessageSquare, Zap, Phone, Bot, Mic, Headphones, BarChart3, Shield, Check, ArrowRight, Twitter, Linkedin, Sparkles, Users, Brain, Target, Upload, Palette, LineChart, Search } from "lucide-react";

export default function Home() {
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
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="#partnerships" className="hover:text-white transition-colors">Partnerships</Link>
            <Link href="#resources" className="hover:text-white transition-colors">Resources</Link>
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

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 via-black to-black" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/10 blur-[120px] rounded-full" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-2 mb-6">
              <span className="text-cyan-400 text-sm font-medium">VOICE AI FOR SHOPIFY</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Boost sales with a{" "}
              <span className="text-cyan-400">Voice AI Agent</span>{" "}
              built for your store
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Launch in minutes, answer every shopper instantly, and convert more carts with a 24/7 specialist that sounds just like your brand.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="/login"
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-4 rounded-full text-lg transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                Start risk-free
                <ChevronRight className="w-5 h-5" />
              </Link>
              <button className="border border-white/20 hover:border-white/40 px-8 py-4 rounded-full text-lg transition-colors flex items-center gap-2 w-full sm:w-auto justify-center">
                <Play className="w-5 h-5" />
                Watch demo
              </button>
            </div>

            <p className="text-gray-500 text-sm">
              14-day money-back guarantee · Setup in under 5 minutes
            </p>

            <div className="mt-8 inline-flex items-center gap-2 text-gray-400 text-sm">
              <span className="text-cyan-400">✦</span>
              Featured on Product Hunt
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="text-6xl md:text-7xl font-bold text-cyan-400">15,000+</div>
            <p className="text-gray-400 mt-2">AI Agents launched with Omakase AI</p>
          </div>
        </div>
      </section>

      {/* Connect Shopify Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Connect your Shopify store in minutes
            </h2>
            <p className="text-xl text-gray-400">
              Turn your Shopify catalog into an AI sales agent.
            </p>
          </div>

          {/* 3 Steps */}
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider">Get started in 3 steps</span>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative group">
                <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 h-full hover:border-cyan-500/50 transition-colors">
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6">
                    <Globe className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="text-cyan-400 text-sm font-semibold mb-2">1. Enter URL</div>
                  <p className="text-gray-400">
                    Simply enter your website URL and let our scraper gather the knowledge needed to serve your customers.
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <ArrowRight className="w-8 h-8 text-white/20" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 h-full hover:border-cyan-500/50 transition-colors">
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6">
                    <MessageSquare className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="text-cyan-400 text-sm font-semibold mb-2">2. Test</div>
                  <p className="text-gray-400">
                    See the power of Omakase Voice for yourself - if necessary fine tune settings such as its knowledge base and persona.
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <ArrowRight className="w-8 h-8 text-white/20" />
                </div>
              </div>

              {/* Step 3 */}
              <div className="group">
                <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 h-full hover:border-cyan-500/50 transition-colors">
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6">
                    <Zap className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="text-cyan-400 text-sm font-semibold mb-2">3. Deploy</div>
                  <p className="text-gray-400">
                    Deploy your agent with one click and watch it engage with your customers 24/7, driving sales and gathering valuable insights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What your AI Sales Agent can do - Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-black via-cyan-950/10 to-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What your AI Sales Agent can do
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature 1 - Multi-Modal */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Multi-Modal AI Agent</h3>
              <p className="text-gray-400 text-sm">
                Engages customers across voice, chat, visuals, and on-site browsing — all at once. Our AI understands page context and adapts in real time.
              </p>
            </div>

            {/* Feature 2 - Drives Sales */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Drives Real Sales, Not Just Conversations</h3>
              <p className="text-gray-400 text-sm">
                More than just a support chatbot. Our AI Agent actively helps customers discover, decide, and buy — boosting conversions through smart recommendations.
              </p>
            </div>

            {/* Feature 3 - Personalized */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Hyper-Personalized Shopping Experiences</h3>
              <p className="text-gray-400 text-sm">
                With every interaction, your AI learns and improves, delivering tailored experiences that turn casual visitors into loyal customers.
              </p>
            </div>

            {/* Feature 4 - Built for Any Business */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
                <Bot className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Built for Any Business</h3>
              <p className="text-gray-400 text-sm">
                Whether you&apos;re a solo shop owner or a large retailer, our solution scales effortlessly — no technical skills or dedicated staff required.
              </p>
            </div>

            {/* Feature 5 - Effortless Setup */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Effortless Setup & Integration</h3>
              <p className="text-gray-400 text-sm">
                Just enter your website URL — our AI does the rest. Skip the code and get started in minutes. We have implementation instructions for all platforms.
              </p>
            </div>

            {/* Feature 6 - On-Brand */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
                <Palette className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">On-Brand</h3>
              <p className="text-gray-400 text-sm">
                Customize your AI Agent persona to match your brand&apos;s tone and style.
              </p>
            </div>

            {/* Feature 7 - Conversational Analytics */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
                <LineChart className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Conversational Analytics</h3>
              <p className="text-gray-400 text-sm">
                Gain AI powered insights with data from real conversations - understand what your customers want and how they shop.
              </p>
            </div>

            {/* Feature 8 - Easy to Train */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
                <Upload className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy to Train & Manage</h3>
              <p className="text-gray-400 text-sm">
                Use the Agentic Dashboard to manage knowledge, and fine-tune your AI Agent — no need for months of manual configuration. We support file uploads.
              </p>
            </div>

            {/* Feature 9 - AI Scraping */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
                <Search className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Scraping & Discovery</h3>
              <p className="text-gray-400 text-sm">
                Our Agent instantly learns from your site with powerful AI scraping — no setup delays or content wrangling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Great */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Here&apos;s what makes us great
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mic className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Voice-Powered Sales Agent</h3>
              <p className="text-gray-400 text-sm">Works like a real sales rep — persuasive, helpful, and always on-brand. No scripted chatbot here.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Live Product Recommendations</h3>
              <p className="text-gray-400 text-sm">Suggests the right products in real time — during conversations and while customers browse your site.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Conversation Analytics</h3>
              <p className="text-gray-400 text-sm">See what your customers are asking, looking for, and buying — all in one simple dashboard.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smarter Scraping Engine</h3>
              <p className="text-gray-400 text-sm">No setup required. Our AI instantly learns your site content and starts selling — out of the box.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Create Agent */}
      <section className="py-16 border-y border-white/10 bg-gradient-to-r from-cyan-950/20 to-blue-950/20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Create Your AI Voice Sales Agent Now
          </h2>
          <p className="text-gray-400 mb-6">
            Create and demo your AI Voice Sales Agent in minutes. Choose a plan that matches now - Cancel anytime.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-4 rounded-full text-lg transition-colors"
          >
            Get Started
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Shopify Integration Banner */}
      <section className="py-12 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-y border-green-500/20">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.337 3.415c-.152-.14-.34-.218-.537-.218-.135 0-.27.035-.39.102l-1.79 1.01c-.324-.206-.69-.327-1.072-.327-.61 0-1.184.285-1.552.77l-1.075-.608a.87.87 0 0 0-.436-.118.863.863 0 0 0-.753.438l-.627 1.084a.867.867 0 0 0 .318 1.186l.723.408c-.045.286-.028.58.052.862-.057.2-.088.41-.088.623 0 .696.306 1.358.84 1.804l-1.377 2.385a.866.866 0 0 0 .318 1.186l3.73 2.11a.865.865 0 0 0 1.188-.316l1.377-2.385c.347-.043.682-.15.987-.32l2.81 1.588a.863.863 0 0 0 1.188-.316l.627-1.084a.866.866 0 0 0-.318-1.186l-2.81-1.588c.02-.097.034-.195.044-.294l1.79-1.01a.866.866 0 0 0 .318-1.186l-.627-1.084a.866.866 0 0 0-.753-.438.865.865 0 0 0-.436.118l-1.79 1.01a2.106 2.106 0 0 0-.29-.244l1.075-1.862a.866.866 0 0 0-.318-1.186l-1.256-.71z"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="text-green-400 font-semibold">Shopify App Integrations Now Available!</p>
              <p className="text-gray-400 text-sm">Connect your Omakase.ai account with Shopify to link your products, payments and more.</p>
            </div>
            <Link href="#" className="text-cyan-400 hover:underline text-sm ml-4">Learn more →</Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Pricing
            </h2>
            <p className="text-gray-400">
              Choose the plan that fits your needs. Simple pricing, no hidden fees.
            </p>
            <p className="text-cyan-400 text-sm mt-2">14-day money-back guarantee</p>
          </div>

          {/* Monthly/Yearly Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className="text-gray-400">Pay Monthly</span>
            <button className="relative w-14 h-7 bg-cyan-500 rounded-full p-1 transition-colors">
              <div className="w-5 h-5 bg-white rounded-full transform translate-x-7" />
            </button>
            <span className="text-white">Pay Annually</span>
            <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-1 rounded-full">Save 20%</span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Intern Plan */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors">
              <h3 className="text-xl font-semibold mb-1">Intern</h3>
              <p className="text-gray-400 text-sm mb-4">(AI Agent)</p>
              <div className="mb-4">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-gray-400">/month</span>
              </div>
              <Link href="/login" className="block w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-full text-center transition-colors mb-2">
                Start Your Plan Now
              </Link>
              <p className="text-gray-500 text-xs text-center mb-6">14-day money-back guarantee</p>
              <ul className="space-y-3 text-sm text-gray-300">
                <li>100 monthly calls and chat conversations</li>
                <li>0.1GB training data</li>
                <li>Voice and chat hybrid interface</li>
                <li>Agentic dashboard</li>
                <li>Conversation data analytics</li>
                <li>AI Agent Persona</li>
                <li>Train AI with file upload, scraping</li>
                <li>Shopify integration</li>
              </ul>
            </div>

            {/* Associate Plan - Most Popular */}
            <div className="bg-gradient-to-b from-cyan-500/20 to-transparent border-2 border-cyan-500 rounded-3xl p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-xs font-semibold px-4 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold mb-1">Associate</h3>
              <p className="text-gray-400 text-sm mb-4">(AI Agent)</p>
              <div className="mb-4">
                <span className="text-4xl font-bold">$149</span>
                <span className="text-gray-400">/month</span>
              </div>
              <Link href="/login" className="block w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-3 rounded-full text-center transition-colors mb-2">
                Start Your Plan Now
              </Link>
              <p className="text-gray-500 text-xs text-center mb-6">14-day money-back guarantee</p>
              <ul className="space-y-3 text-sm text-gray-300">
                <li>1,000 monthly calls and chat conversations</li>
                <li>1GB training data</li>
                <li>Voice and chat hybrid interface</li>
                <li>Agentic dashboard</li>
                <li>Conversation data analytics</li>
                <li>AI Agent Persona</li>
                <li>Train AI with file upload, scraping</li>
                <li>Shopify integration</li>
                <li className="text-cyan-400">Remove &quot;Powered by Omakase.ai&quot;</li>
              </ul>
            </div>

            {/* Principal Plan */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors">
              <h3 className="text-xl font-semibold mb-1">Principal</h3>
              <p className="text-gray-400 text-sm mb-4">(AI Agent)</p>
              <div className="mb-4">
                <span className="text-4xl font-bold">$399</span>
                <span className="text-gray-400">/month</span>
              </div>
              <Link href="/login" className="block w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-full text-center transition-colors mb-2">
                Start Your Plan Now
              </Link>
              <p className="text-gray-500 text-xs text-center mb-6">14-day money-back guarantee</p>
              <ul className="space-y-3 text-sm text-gray-300">
                <li><span className="line-through text-gray-500">3,000</span> 5,000 monthly conversations (launch special!)</li>
                <li>5GB training data</li>
                <li>Voice and chat hybrid interface</li>
                <li>Agentic dashboard</li>
                <li>Conversation data analytics</li>
                <li>AI Agent Persona</li>
                <li>Train AI with file upload, scraping</li>
                <li>Shopify integration</li>
                <li className="text-cyan-400">Remove &quot;Powered by Omakase.ai&quot;</li>
                <li className="text-cyan-400">End-to-end support for implementation, training, and optimization</li>
              </ul>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors">
              <h3 className="text-xl font-semibold mb-1">Custom Enterprise Plan</h3>
              <p className="text-gray-400 text-sm mb-6">Let&apos;s work together to find a plan that suits your team and organization.</p>
              <Link href="mailto:omakase@zeals.ai" className="block w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-full text-center transition-colors mb-6">
                Contact Us
              </Link>
              <ul className="space-y-3 text-sm text-gray-300">
                <li>$100 per 1,000 conversations</li>
                <li>$100 per 1GB training data</li>
                <li>Access to ALL dashboard and AI Agent features</li>
                <li className="text-cyan-400">End-to-end support for implementation, training, and optimization</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-24 bg-gradient-to-b from-black via-cyan-950/5 to-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Case Studies
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6">
              <blockquote className="text-gray-200 mb-4">
                &quot;Families have lots of questions around gluten and food intolerance. Omakase Voice lets people know how our products fit into their lives&quot;
              </blockquote>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="font-semibold text-white">- Elliott</span>
                <span>Founder, GlutenFreeBar</span>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6">
              <blockquote className="text-gray-200 mb-4">
                &quot;It gives you an idea of what marketing is working or not, is your business reflecting that? What are all the customers are asking?&quot;
              </blockquote>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="font-semibold text-white">Jeff Buster</span>
                <span>Buster&apos;s Industrial, President</span>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6">
              <blockquote className="text-gray-200 mb-4">
                &quot;Omakase helps customers stay on my site longer and find the styles they&apos;re looking for&quot;
              </blockquote>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="font-semibold text-white">Shin</span>
                <span>Double Knock, Founder</span>
              </div>
            </div>

            {/* Testimonial 4 */}
            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6">
              <blockquote className="text-gray-200 mb-4">
                &quot;We chose Omakase to help people find information quickly about what they&apos;re looking for and to make more online sales&quot;
              </blockquote>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="font-semibold text-white">Kevin</span>
                <span>Kanoo Group, Group Head of Digital Transformation & AI</span>
              </div>
            </div>

            {/* Testimonial 5 */}
            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6">
              <blockquote className="text-gray-200 mb-4">
                &quot;I never thought AI support could be useful in a restaurant, but it turned out to be incredibly helpful. The interface looks highly professional.&quot;
              </blockquote>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="font-semibold text-white">Luna</span>
                <span>HanaIzumi, Founder</span>
              </div>
            </div>

            {/* Testimonial 6 */}
            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-6">
              <blockquote className="text-gray-200 mb-4">
                &quot;[The agent is] like a savvy best friend who has the best recommendations. Very approachable but very professional.&quot;
              </blockquote>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="font-semibold text-white">Corina</span>
                <span>Multitasky, Operations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-t from-cyan-950/20 to-black">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-6 py-3 mb-8">
              <span className="text-5xl font-bold text-cyan-400">15,000+</span>
              <span className="text-gray-300">AI Agents created with Omakase AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8">
            <p className="text-gray-400">
              Have an inquiry? Reach out to us at{" "}
              <a href="mailto:omakase@zeals.ai" className="text-cyan-400 hover:underline">
                omakase@zeals.ai
              </a>
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <Link href="https://twitter.com" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="https://linkedin.com" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </Link>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link href="#" className="hover:text-white transition-colors">Omakase status</Link>
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white transition-colors">FAQ</Link>
              <Link href="#" className="hover:text-white transition-colors">Manifesto</Link>
              <Link href="#" className="hover:text-white transition-colors">Become an affiliate</Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-gray-500 text-xs">
              © 2025 Omakase.ai. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
