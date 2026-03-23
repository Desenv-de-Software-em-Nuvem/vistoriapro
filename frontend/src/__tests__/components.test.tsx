/**
 * Testes para componentes do frontend
 */

import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

// Types
interface ButtonProps {
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
}

// Componente de exemplo para teste
const Button = ({ onClick, children, disabled = false }: ButtonProps) => (
  <button onClick={onClick} disabled={disabled}>
    {children}
  </button>
);

interface CardProps {
  title: string;
  children: ReactNode;
}

const Card = ({ title, children }: CardProps) => (
  <div data-testid="card">
    <h2>{title}</h2>
    <div>{children}</div>
  </div>
);

const Loading = () => <div data-testid="loading">Carregando...</div>;

describe('Frontend Components', () => {
  describe('Button Component', () => {
    it('deve renderizar um botão', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('deve chamar onClick quando clicado', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      button.click();
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('deve estar desabilitado quando disabled é true', () => {
      render(<Button disabled>Click me</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Card Component', () => {
    it('deve renderizar título e conteúdo', () => {
      render(
        <Card title="Test Card">
          <p>Card content</p>
        </Card>
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('deve ter o atributo data-testid', () => {
      render(
        <Card title="Test Card">
          <p>Content</p>
        </Card>
      );

      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });

  describe('Loading Component', () => {
    it('deve renderizar mensagem de carregamento', () => {
      render(<Loading />);
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });
  });
});

export { Button, Card, Loading };
