"use client";
import { useRef, useEffect, useState, type ReactNode } from "react";
import { cn } from "../lib/utils";

type Props = {
    children: ReactNode;
    className?: string;
    delay?: string;
};

export function AnimateOnScroll({ children, className, delay = "0ms" }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(element);

        return () => {
            if(element) {
                observer.unobserve(element);
            }
        };
    }, []);

    return (
        <div
            ref={ref}
            className={cn(
                "transition-all ease-out duration-1000",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
                className
            )}
            style={{ transitionDelay: delay }}
        >
            {children}
        </div>
    );
}
