from backend.app.db.connection import check_mysql_connection


def main() -> int:
    try:
        result = check_mysql_connection()
    except Exception as error:
        print(f"MySQL connection failed: {error}")
        return 1

    print(result["message"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
