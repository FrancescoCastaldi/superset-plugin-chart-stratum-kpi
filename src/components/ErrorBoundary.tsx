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
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(previous: Props) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div
        role="alert"
        title={error.message}
        style={{
          width: this.props.width,
          height: this.props.height,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 8,
          textAlign: 'center',
          fontSize: '0.8rem',
          opacity: 0.75,
        }}
      >
        {this.props.message}
      </div>
    );
  }
}
