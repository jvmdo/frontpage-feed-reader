import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Section,
  Text,
} from "@react-email/components";

export function PasswordResetEmail({ resetUrl }: { resetUrl: string }) {
  return (
    <Html>
      <Head />
      <Body
        style={{
          fontFamily: "sans-serif",
          backgroundColor: "#f9f9f9",
          padding: "20px",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            padding: "20px",
            borderRadius: "5px",
          }}
        >
          <Section>
            <Text style={{ fontSize: "18px", fontWeight: "bold" }}>
              Reset your Frontpage password
            </Text>
            <Text>
              You recently requested to reset your password for your Frontpage
              account. Click the button below to reset it. This password reset
              is only valid for the next 24 hours.
            </Text>
            <Button
              href={resetUrl}
              style={{
                backgroundColor: "#000",
                color: "#fff",
                padding: "12px 20px",
                borderRadius: "5px",
                textDecoration: "none",
                display: "inline-block",
                marginTop: "10px",
              }}
            >
              Reset Password
            </Button>
            <Text
              style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}
            >
              If you did not request a password reset, please ignore this email
              or contact support if you have questions.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
