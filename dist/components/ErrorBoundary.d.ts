import React from 'react';
interface Props {
    children: React.ReactNode;
    width?: number;
    height?: number;
    /** Testo mostrato al posto della scheda. */
    message: string;
    /** Quando cambia (nuovi dati o impostazioni) l'errore precedente viene dimenticato e si riprova. */
    resetKey?: unknown;
}
interface State {
    error: Error | null;
}
/**
 * Se il disegno della scheda solleva un errore (dato inatteso, impostazione non valida) mostra un
 * messaggio al posto del grafico invece di lasciare vuota la card della dashboard.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
    state: State;
    static getDerivedStateFromError(error: Error): State;
    componentDidUpdate(previous: Props): void;
    render(): string | number | boolean | React.JSX.Element | Iterable<React.ReactNode> | null | undefined;
}
export {};
//# sourceMappingURL=ErrorBoundary.d.ts.map