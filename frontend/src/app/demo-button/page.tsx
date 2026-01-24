import { Button } from "@/components/ui/button"
import { Mail, Loader2 } from "lucide-react"

export default function ButtonDemo() {
    return (
        <div className="p-8 space-y-8 flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-3xl font-bold">Botones Shadcn</h1>

            <div className="flex gap-4 flex-wrap justify-center p-4 border rounded-xl">
                <h2 className="w-full text-center text-xl font-semibold mb-2">Variantes</h2>
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
            </div>

            <div className="flex gap-4 flex-wrap justify-center p-4 border rounded-xl">
                <h2 className="w-full text-center text-xl font-semibold mb-2">Tamaños</h2>
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><Mail className="h-4 w-4" /></Button>
            </div>

            <div className="flex gap-4 flex-wrap justify-center p-4 border rounded-xl">
                <h2 className="w-full text-center text-xl font-semibold mb-2">Con Iconos y Estados</h2>
                <Button>
                    <Mail className="mr-2 h-4 w-4" /> Login
                </Button>
                <Button disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando
                </Button>
                <Button className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 border-0 text-white font-bold shadow-lg transform hover:scale-105 transition-all">
                    Botón "Bonito" Gradiente
                </Button>
            </div>
        </div>
    )
}
