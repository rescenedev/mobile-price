import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind 클래스 병합 유틸(shadcn 표준). 충돌 클래스는 뒤 값 우선. */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
