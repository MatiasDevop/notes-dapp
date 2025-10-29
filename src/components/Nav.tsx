"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <svg
                className="w-6 h-6 text-green-600 group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="ml-2 text-lg font-semibold text-gray-900">
                Notes dApp
              </span>
            </Link>
          </div>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/features"
              className="text-gray-600 hover:text-gray-900"
            >
              AI Features
            </Link>
            <Link
              href="/demo"
              className={`text-gray-600 hover:text-gray-900 ${
                pathname === "/demo" ? "text-gray-900" : ""
              }`}
            >
              Explore
            </Link>
            <Link href="/plans" className="text-gray-600 hover:text-gray-900">
              Plans
            </Link>
            <Link
              href="/enterprise"
              className="text-gray-600 hover:text-gray-900"
            >
              Enterprise
            </Link>
          </div>

          {/* Right Side Navigation */}
          <div className="flex items-center space-x-4">
            <Link
              href="/demo"
              className="hidden md:block text-gray-600 hover:text-gray-900"
            >
              Log in
            </Link>
            {/* <WalletMultiButton className="!bg-black hover:!bg-gray-800" /> */}
            <Link
              href="/demo"
              className="hidden md:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700"
            >
              Start for free
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
