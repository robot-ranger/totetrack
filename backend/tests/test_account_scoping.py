import sys
import unittest
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from app.db import Base
import app.crud as crud
import app.schemas as schemas


class AccountScopingTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite:///:memory:", future=True)
        self.SessionLocal = sessionmaker(bind=self.engine, expire_on_commit=False, future=True)
        Base.metadata.create_all(bind=self.engine)

    def tearDown(self) -> None:
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def _session(self):
        return self.SessionLocal()

    def test_account_creation_creates_superuser(self):
        with self._session() as db:
            account, owner = crud.create_account(
                db,
                schemas.AccountCreate(
                    name="Team Alpha",
                    owner_email="alpha@example.com",
                    owner_full_name="Alpha Owner",
                    owner_password="secret123",
                ),
            )

            self.assertIsNotNone(account.id)
            self.assertEqual(owner.account_id, account.id)
            self.assertTrue(owner.is_superuser)
            self.assertEqual(owner.email, "alpha@example.com")

    def test_data_isolation_between_accounts(self):
        with self._session() as db:
            account_a, owner_a = crud.create_account(
                db,
                schemas.AccountCreate(
                    name="Team Bravo",
                    owner_email="bravo@example.com",
                    owner_full_name="Bravo Owner",
                    owner_password="secret123",
                ),
            )
            account_b, owner_b = crud.create_account(
                db,
                schemas.AccountCreate(
                    name="Team Charlie",
                    owner_email="charlie@example.com",
                    owner_full_name="Charlie Owner",
                    owner_password="secret123",
                ),
            )

            tote_a = crud.create_tote(db, schemas.ToteCreate(name="Bravo Tote"), account_a.id)
            crud.create_tote(db, schemas.ToteCreate(name="Charlie Tote"), account_b.id)

            totes_a = crud.list_totes(db, account_a.id)
            totes_b = crud.list_totes(db, account_b.id)

            self.assertEqual(len(totes_a), 1)
            self.assertEqual(totes_a[0].id, tote_a.id)

            self.assertEqual(len(totes_b), 1)
            self.assertNotEqual(totes_b[0].id, tote_a.id)

            self.assertIsNotNone(crud.get_tote(db, tote_a.id, account_a.id))
            self.assertIsNone(crud.get_tote(db, tote_a.id, account_b.id))

            items_a = crud.list_items(db, account_a.id)
            self.assertEqual(items_a, [])

    def test_single_superuser_constraint(self):
        with self._session() as db:
            account, owner = crud.create_account(
                db,
                schemas.AccountCreate(
                    name="Team Delta",
                    owner_email="delta@example.com",
                    owner_full_name="Delta Owner",
                    owner_password="secret123",
                ),
            )

            with self.assertRaises(ValueError):
                crud.create_user(
                    db,
                    account.id,
                    schemas.UserCreate(
                        email="delta-second@example.com",
                        full_name="Second",
                        password="secret123",
                    ),
                    as_superuser=True,
                )

            with self.assertRaises(ValueError):
                crud.update_user(
                    db,
                    owner,
                    schemas.UserUpdate(is_superuser=False),
                )


if __name__ == "__main__":
    unittest.main()
